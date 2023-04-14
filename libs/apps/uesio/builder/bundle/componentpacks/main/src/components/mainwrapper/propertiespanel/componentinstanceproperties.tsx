import { component, definition } from "@uesio/ui"
import { useDefinition } from "../../../api/defapi"
import { isStylesSection } from "../../../api/propertysection"
import {
	ComponentDef,
	getComponentDef,
	useSelectedPath,
} from "../../../api/stateapi"
import PropertiesForm from "../../../helpers/propertiesform"

function getSections(componentType: string, componentDef?: ComponentDef) {
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

	const selectedPath = useSelectedPath(context)

	const selectedDef = useDefinition(selectedPath)

	const [key] = selectedPath.pop()

	let path = selectedPath

	// If our topmost key was an index we need to get the next one
	// from the definition
	if (component.path.isNumberIndex(key) && selectedDef) {
		path = selectedPath.addLocal(Object.keys(selectedDef)[0])
	}
	// Trim our path down to our nearest component
	path = path.trim()

	const [componentType] = path.pop()
	const componentDef = getComponentDef(context, componentType)

	if (!componentDef) return null

	// This forces a rerender if the definition changes
	// useDefinition(selectedPath) as definition.DefinitionMap

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
