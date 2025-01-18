import { definition } from "@uesio/ui"
import { isStylesSection } from "../../../api/propertysection"
import {
  ComponentDef,
  getComponentDef,
  useSelectedComponentPath,
} from "../../../api/stateapi"
import PropertiesForm from "../../../helpers/propertiesform"
import NothingSelectedProperties from "./nothingselectedproperties"

export function getSections(
  componentType: string,
  componentDef?: ComponentDef,
) {
  const sections = componentDef?.sections
  if (sections && sections.length) {
    // The Styles section needs to have the Component Type merged in to be valid
    return sections.map((section) => {
      if (isStylesSection(section)) {
        return {
          ...section,
          componentType,
        }
      }
      return section
    })
  }
  return sections
}

const ComponentInstanceProperties: definition.UtilityComponent = (props) => {
  const { context } = props

  const path = useSelectedComponentPath(context)

  const [componentType] = path.pop()
  const componentDef = getComponentDef(componentType)

  if (!componentDef) return <NothingSelectedProperties context={context} />

  return (
    <PropertiesForm
      context={context}
      properties={componentDef.properties}
      sections={getSections(componentType as string, componentDef)}
      title={componentDef.title || componentDef.name}
      path={path}
      id={path.combine()}
    />
  )
}

ComponentInstanceProperties.displayName = "Component Properties"

export default ComponentInstanceProperties
