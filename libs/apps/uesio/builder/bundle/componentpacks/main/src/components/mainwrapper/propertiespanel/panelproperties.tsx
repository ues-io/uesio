import { definition } from "@uesio/ui"
import PropertiesForm from "../../../helpers/propertiesform"
import { getComponentDef, useSelectedPath } from "../../../api/stateapi"
import { get, useDefinition } from "../../../api/defapi"
import { ComponentProperty } from "../../../properties/componentproperty"
export const panelComponentTypeProp = "uesio.type"
const defaultPanelComponentType = "uesio/io.dialog"

const panelProperties = [
	{
		name: panelComponentTypeProp,
		label: "Panel Type",
		required: true,
		type: "SELECT",
		options: [{ value: defaultPanelComponentType, label: "Dialog" }],
	},
] as ComponentProperty[]

const PanelProperties: definition.UtilityComponent = (props) => {
	const { context } = props
	const path = useSelectedPath(context).trimToSize(2)
	// force rerender if definition changes - otherwise, properties won't update
	useDefinition(path)
	const componentDef = getComponentDef(
		get(context, path.addLocal(panelComponentTypeProp)) as string
	)
	return (
		<PropertiesForm
			context={context}
			path={path}
			id={path.combine()}
			title={"Panel Properties"}
			properties={panelProperties.concat(componentDef?.properties || [])}
			sections={componentDef?.sections}
		/>
	)
}

PanelProperties.displayName = "PanelProperties"

export default PanelProperties
