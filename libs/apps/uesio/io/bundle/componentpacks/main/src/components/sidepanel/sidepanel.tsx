import { definition, api, component } from "@uesio/ui"

import { default as IOSidePanel } from "../../utilities/sidepanel/sidepanel"

type SidePanelDefinition = {
  id?: string
  closeOnOutsideClick?: boolean
  closed?: boolean
}

const SidePanel: definition.UC<SidePanelDefinition> = (props) => {
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
    <IOSidePanel
      onClose={onClose}
      closed={definition.closed}
      context={context}
      styleTokens={definition[component.STYLE_TOKENS]}
      variant={definition[component.STYLE_VARIANT]}
      closeOnOutsideClick={definition.closeOnOutsideClick}
    >
      <component.Slot
        definition={definition}
        listName="components"
        path={path}
        context={context}
        componentType={componentType}
      />
    </IOSidePanel>
  )
}

export type { SidePanelDefinition }
export default SidePanel
