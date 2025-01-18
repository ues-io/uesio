import { definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import {
  getComponentDef,
  setSelectedPath,
  useSelectedPath,
} from "../../../api/stateapi"
import ItemTag from "../../../utilities/itemtag/itemtag"

const ComponentTypeProperties: definition.UtilityComponent = (props) => {
  const { context } = props

  const selectedPath = useSelectedPath(context)

  const componentDef = getComponentDef(selectedPath.itemName)
  if (!componentDef) return null

  return (
    <PropertiesWrapper
      context={context}
      className={props.className}
      path={selectedPath}
      title={componentDef.title || componentDef.name}
      onUnselect={() => setSelectedPath(context)}
    >
      <ItemTag context={context} description={componentDef.description} />
    </PropertiesWrapper>
  )
}

ComponentTypeProperties.displayName = "ComponentTypeProperties"

export default ComponentTypeProperties
