import { definition, styles } from "@uesio/ui"
import PanelWrapper from "../panelwrapper/panelwrapper"

interface DialogPlainUtilityProps {
  onClose?: () => void
  width?: string
  height?: string
  initialFocus?: number
  closeOnOutsideClick?: boolean
  closed?: boolean
}

const DialogPlain: definition.UtilityComponent<DialogPlainUtilityProps> = (
  props,
) => {
  const {
    onClose,
    width,
    height,
    initialFocus,
    closeOnOutsideClick,
    closed,
    children,
  } = props

  const classes = styles.useUtilityStyleTokens(
    {
      blocker: [],
      wrapper: [
        ...(props.width ? [`w-[${width}]`] : ["w-1/2"]),
        ...(props.height ? [`h-[${height}]`] : ["h-1/2"]),
      ],
      inner: [],
      blockerClosed: [],
      wrapperClosed: [],
      innerClosed: [],
    },
    props,
    "uesio/io.dialog",
  )

  return (
    <PanelWrapper
      onClose={onClose}
      initialFocus={initialFocus}
      closeOnOutsideClick={closeOnOutsideClick}
      closed={closed}
      context={props.context}
      classes={classes}
    >
      {children}
    </PanelWrapper>
  )
}

export default DialogPlain
