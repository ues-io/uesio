import { definition, component, context } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import PropertiesForm from "../../../helpers/propertiesform"
import { useSelectedPath, getComponentDef } from "../../../api/stateapi"
import { get } from "../../../api/defapi"
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
] as component.ComponentProperty[]

const getPanelComponentProperties = (
	context: context.Context,
	componentType: string
) => getComponentDef(context, componentType)?.properties || []

const PanelProperties: definition.UtilityComponent = (props) => {
	const { context } = props
	const path = useSelectedPath(context)
	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={path}
			title={"Panel Properties"}
		>
			<PropertiesForm
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
		</PropertiesWrapper>
	)
}

PanelProperties.displayName = "PanelProperties"

export default PanelProperties
