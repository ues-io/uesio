import { definition, styles } from "@uesio/ui"
import PanelWrapper from "../panelwrapper/panelwrapper"

interface SidePanelUtilityProps {
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

const SidePanelPlain: definition.UtilityComponent<SidePanelUtilityProps> = (
  props,
) => {
  const { onClose, initialFocus, closeOnOutsideClick, closed, children } = props
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.sidepanel",
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

export default SidePanelPlain
