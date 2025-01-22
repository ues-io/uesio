import { definition, styles } from "@uesio/ui"
import {
  FloatingPortal,
  FloatingFocusManager,
  FloatingOverlay,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react"

interface PanelWrapperUtilityProps {
  onClose?: () => void
  initialFocus?: number
  closeOnOutsideClick?: boolean
  closed?: boolean
}

const StyleDefaults = Object.freeze({
  blocker: [],
  wrapper: [],
  inner: [],
  blockerClosed: [],
  wrapperClosed: [],
  innerClosed: [],
})

const PanelWrapper: definition.UtilityComponent<PanelWrapperUtilityProps> = (
  props,
) => {
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.panelwrapper",
  )

  const floating = useFloating({
    open: true,
    onOpenChange: (open) => {
      if (!open && props.onClose) props.onClose()
    },
  })

  const outsideClickFunc = (e: MouseEvent) => {
    const target = e.target
    if (!(target instanceof HTMLElement)) return false
    return !!target.closest("#canvas-root")
  }

  const closeOnOutsideClick =
    props.closeOnOutsideClick === undefined
      ? outsideClickFunc
      : !!props.closeOnOutsideClick

  const dismiss = useDismiss(floating.context, {
    outsidePress: closeOnOutsideClick,
  })

  const { getFloatingProps } = useInteractions([dismiss])

  return (
    <FloatingPortal id="canvas-root">
      <FloatingOverlay
        className={styles.cx(
          classes.blocker,
          props.closed && classes.blockerClosed,
        )}
        lockScroll
        style={{ position: "absolute" }}
      >
        <FloatingFocusManager
          context={floating.context}
          initialFocus={props.initialFocus}
          closeOnFocusOut={false}
        >
          <div
            className={styles.cx(
              classes.wrapper,
              props.closed && classes.wrapperClosed,
            )}
            ref={floating.refs.setFloating}
            {...getFloatingProps()}
          >
            <div
              className={styles.cx(
                classes.inner,
                props.closed && classes.innerClosed,
              )}
            >
              {props.children}
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  )
}

export default PanelWrapper
