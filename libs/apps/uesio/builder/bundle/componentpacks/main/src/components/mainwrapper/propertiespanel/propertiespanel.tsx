import { context, definition } from "@uesio/ui"

import { getComponentDef, useSelectedPath } from "../../../api/stateapi"
import ComponentInstanceProperties from "./componentinstanceproperties"
import ComponentTypeProperties from "./componenttypeproperties"
import NothingSelectedProperties from "./nothingselectedproperties"
import PanelProperties, { panelComponentTypeProp } from "./panelproperties"
import ParamProperties from "./paramproperties"
import WireProperties from "./wire/wireproperties"
import { get } from "../../../api/defapi"
import { FullPath } from "../../../api/path"

// Returns true if properties for a top-level Panel should be displayed,
// as a special case, rather than properties for Components within the panel.
const shouldDisplayPanelProperties = (
  context: context.Context,
  selectedPath: FullPath,
): boolean => {
  const pathSize = selectedPath.size()
  const panelNodePath = selectedPath.trimToSize(2)
  const [panelNode] = selectedPath.trimToSize(3).pop()
  const componentType = panelNodePath.addLocal(panelComponentTypeProp)
  const componentDef = getComponentDef(get(context, componentType) as string)
  const slotNames = componentDef?.slots?.map((slot) => slot.name)

  if (pathSize !== 2 && panelNode && slotNames?.includes(panelNode)) {
    // A component within the panel is selected, so display Component instance properties
    return false
  } else {
    // The Panel itself, or one of its nested property sections, are selected
    return true
  }
}

const PropertiesPanel: definition.UtilityComponent = (props) => {
  const { context } = props
  const selectedPath = useSelectedPath(context)

  switch (selectedPath.itemType) {
    case "viewdef": {
      const [firstNode] = selectedPath.shift()
      switch (firstNode) {
        case "components":
          return <ComponentInstanceProperties {...props} />
        case "wires":
          return <WireProperties {...props} />
        case "panels":
          if (shouldDisplayPanelProperties(context, selectedPath)) {
            return <PanelProperties {...props} />
          } else {
            return <ComponentInstanceProperties {...props} />
          }
        case "params":
          return <ParamProperties {...props} />
      }
      break
    }
    case "component": {
      return <ComponentTypeProperties {...props} />
    }
  }
  return <NothingSelectedProperties {...props} />
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
