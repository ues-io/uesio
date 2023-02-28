import { definition, context } from "@uesio/ui"
import PropertiesForm from "../../../helpers/propertiesform"
import { useSelectedPath, getComponentDef } from "../../../api/stateapi"
import { get } from "../../../api/defapi"
import { ComponentProperty } from "../../../properties/componentproperty"
const panelComponentTypeProp = "uesio.type"
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

const getPanelComponentProperties = (
	context: context.Context,
	componentType: string
) => getComponentDef(context, componentType)?.properties || []

const PanelProperties: definition.UtilityComponent = (props) => {
	const { context } = props
	const path = useSelectedPath(context)
	return (
		<PropertiesForm
			title={"Panel Properties"}
			id={path.combine()}
			context={context}
			properties={panelProperties.concat(
				getPanelComponentProperties(
					context,
					get(
						context,
						path.addLocal(panelComponentTypeProp)
					) as string
				)
			)}
			path={path}
		/>
	)
}

PanelProperties.displayName = "PanelProperties"

export default PanelProperties
