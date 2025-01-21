import { useLayoutEffect, useRef } from "react"
import { definition, styles } from "@uesio/ui"
import {
  useFloating,
  autoUpdate,
  hide,
  autoPlacement,
  Placement,
  offset,
  size,
  FloatingPortal,
  arrow,
  FloatingArrow,
  MiddlewareState,
} from "@floating-ui/react"

interface TooltipProps {
  placement?: Placement
  referenceEl: HTMLDivElement | null
  onOutsideClick?: () => void
  offset?: number
  autoPlacement?: Placement[]
  parentSelector?: string
  matchHeight?: boolean
  arrow?: boolean
  portalId?: string
}

const defaultPlacement: Placement[] = ["top", "bottom"]

const getRelativeParent = (
  elem: Element | null,
  parentSelector: string,
): Element | null => {
  if (!elem) return null
  const parent = elem.parentElement
  if (!parent) return elem
  if (parent.matches(parentSelector)) return parent
  return getRelativeParent(parent, parentSelector)
}

const StyleDefaults = Object.freeze({
  popper: ["z-20"],
  arrow: [],
})

const Popper: definition.UtilityComponent<TooltipProps> = (props) => {
  const autoPlacements = props.autoPlacement || defaultPlacement

  const arrowRef = useRef(null)

  const { x, y, strategy, refs, middlewareData, context } = useFloating({
    whileElementsMounted: (...args) =>
      autoUpdate(...args, { animationFrame: true }),
    placement: props.placement,
    middleware: [
      offset(props.offset),
      autoPlacement({ allowedPlacements: autoPlacements }),
      hide(),
      ...(props.matchHeight
        ? [
            size({
              apply({ rects, elements }: MiddlewareState) {
                Object.assign(elements.floating.style, {
                  height: `${rects.reference.height}px`,
                })
              },
            }),
          ]
        : []),
      ...(props.arrow
        ? [
            arrow({
              element: arrowRef,
            }),
          ]
        : []),
    ],
  })

  useLayoutEffect(() => {
    const referenceEl = props.parentSelector
      ? getRelativeParent(props.referenceEl, props.parentSelector)
      : props.referenceEl
    refs.setReference(referenceEl)
  }, [refs, props.referenceEl, props.parentSelector])

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  return (
    <FloatingPortal id={props.portalId}>
      <div
        ref={refs.setFloating}
        style={{
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
          width: "max-content",
          visibility: middlewareData.hide?.referenceHidden
            ? "hidden"
            : "visible",
        }}
        onClick={(e) => {
          // This is important because it stops events from propagating
          // under the popper. One example was that the FloatingOverlay
          // component behind the dialog was causing select boxes to
          // immediately close if the FloatingOverlay was behind this popper.
          e.stopPropagation()
        }}
        className={classes.popper}
      >
        {props.children}
        {props.arrow && (
          <FloatingArrow
            width={12}
            height={6}
            className={classes.arrow}
            ref={arrowRef}
            context={context}
          />
        )}
      </div>
    </FloatingPortal>
  )
}

export default Popper
