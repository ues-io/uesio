import { definition, component } from "@uesio/ui"

interface PopoutPanelProps {
  referenceEl: HTMLDivElement | null
}

const PopoutPanel: definition.UtilityComponent<PopoutPanelProps> = (props) => {
  const { context, children, referenceEl } = props
  const Popper = component.getUtility("uesio/io.popper")
  return (
    <Popper
      referenceEl={referenceEl}
      matchHeight
      context={context}
      offset={8}
      placement="right-start"
      autoPlacement={["right-start"]}
      parentSelector="#propertieswrapper"
      styleTokens={{
        popper: [
          "box-content",
          "border-r-8",
          "border-b-8",
          "border-panel_divider_color",
        ],
      }}
      portalId="builder-root"
    >
      {children}
    </Popper>
  )
}

PopoutPanel.displayName = "PopoutPanel"

export default PopoutPanel
