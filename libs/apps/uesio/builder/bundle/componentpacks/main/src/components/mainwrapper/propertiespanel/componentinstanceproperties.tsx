import { component, definition, wire } from "@uesio/ui"
import PropertiesWrapper, { Tab } from "./propertieswrapper"
import {
	getComponentDef,
	setSelectedPath,
	useSelectedPath,
	useBuilderState,
	ComponentDef,
} from "../../../api/stateapi"
import { getSignalProperties } from "../../../api/signalsapi"

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
import {
	ComponentProperty,
	getStyleVariantProperty,
} from "../../../properties/componentproperty"
import {
	DisplayConditionProperties,
	getDisplayConditionLabel,
} from "../../../properties/conditionproperties"

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
		getSectionId(sections[0])
	)

	if (!componentDef) return null

	// This forces a rerender if the definition changes
	// useDefinition(selectedPath) as definition.DefinitionMap

	let content: ReactNode = null
	const selectedSection =
		sections.find((section) => selectedTab === getSectionId(section)) ||
		sections[0]
	const selectedSectionId = getSectionId(selectedSection)
	let properties = componentDef.properties || ([] as ComponentProperty[])

	switch (selectedSection?.type) {
		case "DISPLAY": {
			properties = [
				{
					name: selectedSectionId,
					type: "LIST",
					items: {
						properties: DisplayConditionProperties,
						displayTemplate: (record: wire.PlainWireRecord) =>
							getDisplayConditionLabel(
								record as component.DisplayCondition
							),
						addLabel: "New Condition",
						title: "Condition Properties",
						defaultDefinition: {
							type: "fieldValue",
							operator: "EQUALS",
						},
					},
				},
			]
			break
		}
		case "STYLES": {
			properties = [getStyleVariantProperty(componentType as string)]
			break
		}
		case "SIGNALS": {
			properties = [
				{
					name: selectedSectionId,
					type: "LIST",
					items: {
						properties: (record: wire.PlainWireRecord) =>
							getSignalProperties(record, context),
						displayTemplate: "${signal}",
						addLabel: "New Signal",
						title: "Signal Properties",
						defaultDefinition: {
							signal: "",
						},
					},
				},
			]
			break
		}
		case "CUSTOM":
			content = selectedSection?.viewDefinition
	}

	function getPropertyTabForSection(section: PropertiesPanelSection): Tab {
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
			tabs={sections.map(getPropertyTabForSection)}
		>
			<PropertiesForm
				id={path.addLocal(selectedSectionId).combine()}
				context={context}
				properties={properties}
				path={path}
			>
				{content}
			</PropertiesForm>
		</PropertiesWrapper>
	)
}

ComponentInstanceProperties.displayName = "Component Properties"

export default ComponentInstanceProperties
