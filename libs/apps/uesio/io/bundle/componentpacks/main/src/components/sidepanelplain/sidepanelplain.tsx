import { definition, component, api } from "@uesio/ui"
import { default as IOSidePanelPlain } from "../../utilities/sidepanelplain/sidepanelplain"
import { SidePanelDefinition } from "../sidepanel/sidepanel"

const PlainSidePanel: definition.UC<SidePanelDefinition> = (props) => {
  const { context, definition, path, componentType } = props
  if (!definition) return null
  const panelId = definition?.id as string
  const onClose = api.signal.getHandler(
    [
      {
        signal: "panel/TOGGLE",
        panel: panelId,
      },
    ],
    context,
  )
  return (
    <IOSidePanelPlain
      onClose={onClose}
      context={context}
      styleTokens={definition[component.STYLE_TOKENS]}
      variant={definition[component.STYLE_VARIANT]}
      closeOnOutsideClick={definition.closeOnOutsideClick}
      closed={definition.closed}
    >
      <component.Slot
        definition={definition}
        listName="components"
        path={path}
        context={context}
        componentType={componentType}
      />
    </IOSidePanelPlain>
  )
}

export default PlainSidePanel
