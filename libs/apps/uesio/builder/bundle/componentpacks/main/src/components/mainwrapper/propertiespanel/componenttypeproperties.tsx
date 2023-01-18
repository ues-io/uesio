import { definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import {
	getComponentDef,
	setSelectedPath,
	useSelectedPath,
} from "../../../api/stateapi"

const ComponentTypeProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const componentDef = getComponentDef(context, selectedPath.itemName)
	if (!componentDef) return null

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={selectedPath}
			title={componentDef.title || componentDef.name}
			onUnselect={() => setSelectedPath(context)}
		>
			<div>{componentDef.description}</div>
		</PropertiesWrapper>
	)
}

ComponentTypeProperties.displayName = "WireProperties"

export default ComponentTypeProperties
