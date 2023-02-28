import { component, definition } from "@uesio/ui"
import { useDefinition } from "../../../api/defapi"
import {
	DISPLAY_SECTION,
	getStylesSection,
	HOME_SECTION,
	isDisplaySection,
	isStylesSection,
	PropertiesPanelSection,
} from "../../../api/propertysection"
import {
	ComponentDef,
	getComponentDef,
	useSelectedPath,
} from "../../../api/stateapi"
import PropertiesForm from "../../../helpers/propertiesform"

function getSections(componentType: string, componentDef?: ComponentDef) {
	let sections = componentDef?.sections
	if (sections && sections.length) {
		// Make sure that the Styles and Display sections are present, regardless
		const standardSections = []
		if (!sections.find(isStylesSection)) {
			standardSections.push(getStylesSection(componentType))
		}
		if (!sections.find(isDisplaySection)) {
			standardSections.push(DISPLAY_SECTION)
		}
		if (standardSections.length) {
			sections = sections.concat(standardSections)
		}
	} else {
		// Use our default sections
		sections = [
			HOME_SECTION,
			getStylesSection(componentType),
			DISPLAY_SECTION,
		] as PropertiesPanelSection[]
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
		/>
	)
}

ComponentInstanceProperties.displayName = "Component Properties"

export default ComponentInstanceProperties
