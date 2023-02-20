import { component, definition } from "@uesio/ui"
import PropertiesWrapper, { Tab } from "./propertieswrapper"
import {
	getComponentDef,
	setSelectedPath,
	useSelectedPath,
	useBuilderState,
	ComponentDef,
} from "../../../api/stateapi"

import { useDefinition } from "../../../api/defapi"
import PropertiesForm from "../../../helpers/propertiesform"
import {
	DISPLAY_SECTION,
	HOME_SECTION,
	PropertiesPanelSection,
	STYLES_SECTION,
	isStylesSection,
	isDisplaySection,
	CustomSection,
	isCustomSection,
	getSectionIcon,
	getSectionId,
	getSectionLabel,
} from "../../../api/propertysection"
import { ReactNode } from "react"
import { getStyleVariantProperty } from "../../../api/componentproperty"

function getSections(componentDef?: ComponentDef) {
	let sections = componentDef?.sections
	if (sections && sections.length) {
		// Make sure that the Styles and Display sections are present, regardless
		const standardSections = []
		if (!sections.find(isStylesSection)) {
			standardSections.push(STYLES_SECTION)
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
			STYLES_SECTION,
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

	const sections = getSections(componentDef)

	const [selectedTab, setSelectedTab] = useBuilderState<string>(
		context,
		"selectedpropertiestab",
		sections[0].id || sections[0].label
	)

	if (!componentDef) return null

	// This forces a rerender if the definition changes
	// useDefinition(selectedPath) as definition.DefinitionMap

	let content: ReactNode = null

	switch (selectedTab) {
		case "uesio.home": {
			content = (
				<PropertiesForm
					id={path.addLocal(selectedTab).combine()}
					context={context}
					properties={componentDef.properties}
					path={path}
				/>
			)
			break
		}
		case "uesio.display": {
			content = <>DISPLAY</>
			break
		}
		case "uesio.styles": {
			content = (
				<PropertiesForm
					id={path.addLocal(selectedTab).combine()}
					context={context}
					properties={[
						// Style Variant
						getStyleVariantProperty(componentType as string),
						// Custom Styles
					]}
					path={path}
				/>
			)
			break
		}
		case "uesio.signals": {
			content = <>SIGNALS</>
			break
		}
		default:
			content = (
				<PropertiesForm
					id={path.combine()}
					context={context}
					properties={componentDef.properties}
					content={
						sections
							.filter(isCustomSection)
							.find(
								(section: CustomSection) =>
									section.id === selectedTab
							)?.viewDefinition
					}
					path={path}
				/>
			)
	}

	function getSectionForTab(section: PropertiesPanelSection): Tab {
		return {
			id: getSectionId(section),
			label: getSectionLabel(section),
			icon: getSectionIcon(section),
		}
	}

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={selectedPath}
			title={componentDef.title || componentDef.name}
			onUnselect={() => setSelectedPath(context)}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
			tabs={sections.map(getSectionForTab)}
		>
			{content}
		</PropertiesWrapper>
	)
}

ComponentInstanceProperties.displayName = "Component Properties"

export default ComponentInstanceProperties
