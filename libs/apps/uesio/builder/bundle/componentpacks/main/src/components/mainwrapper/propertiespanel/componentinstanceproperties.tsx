import { component, definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import {
	getComponentDef,
	setSelectedPath,
	useSelectedPath,
} from "../../../api/stateapi"

import { useDefinition } from "../../../api/defapi"
import PropertiesForm from "../../../helpers/propertiesform"

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

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={path}
			title={componentDef.title || componentDef.name}
			onUnselect={() => setSelectedPath(context)}
		>
			<PropertiesForm
				id={path.combine()}
				context={context}
				properties={componentDef.properties}
				content={componentDef.propertiesPanelView}
				path={path}
			/>
		</PropertiesWrapper>
	)
}

ComponentInstanceProperties.displayName = "Component Properties"

export default ComponentInstanceProperties
