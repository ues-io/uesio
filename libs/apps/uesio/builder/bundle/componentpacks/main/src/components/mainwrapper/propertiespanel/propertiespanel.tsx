import { definition, api, component } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import {
	getComponentDef,
	setSelectedPath,
	useSelectedPath,
} from "../../../api/stateapi"
import { ReactNode } from "react"
import { useDefinition } from "../../../api/defapi"

const PropertiesPanel: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const selectedDef = useDefinition(selectedPath)

	const componentId = api.component.getComponentId(
		"propertiespanel" + selectedPath.combine(),
		"uesio/builder.mainwrapper",
		"",
		context
	)

	const [selectedTab, setSelectedTab] = api.component.useState<string>(
		componentId,
		""
	)

	let title = ""
	let content: ReactNode = null
	let path = selectedPath

	switch (selectedPath.itemType) {
		case "viewdef": {
			const [key] = selectedPath.pop()

			// If our topmost key was an index we need to get the next one
			// from the definition
			if (component.path.isNumberIndex(key) && selectedDef) {
				path = selectedPath.addLocal(Object.keys(selectedDef)[0])
			}
			// Trim our path down to our nearest component
			path = path.trim()

			const [componentType] = path.pop()
			const componentDef = getComponentDef(context, componentType)
			if (!componentDef) break

			title = componentDef.title || componentDef.name
			content = <div>{componentDef.description}</div>
			break
		}
		case "component": {
			const componentDef = getComponentDef(context, selectedPath.itemName)
			if (!componentDef) break
			title = componentDef.title || componentDef.name
			content = <div>{componentDef.description}</div>
			break
		}
	}

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={path}
			title={title}
			selectedTab={selectedTab || ""}
			setSelectedTab={setSelectedTab}
			onUnselect={() => setSelectedPath(context)}
		>
			{content}
		</PropertiesWrapper>
	)
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
