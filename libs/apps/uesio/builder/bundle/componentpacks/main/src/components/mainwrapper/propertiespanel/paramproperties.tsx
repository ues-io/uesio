import { definition } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import PropertiesForm from "../../../helpers/propertiesform"
import { useSelectedPath } from "../../../api/stateapi"
import { ComponentProperty } from "../../../api/componentproperty"

const paramProperties = [
	{
		name: "name",
		label: "Name",
		required: true,
		type: "KEY",
	},
	{
		name: "required",
		label: "Required",
		required: true,
		type: "CHECKBOX",
	},
	{
		name: "type",
		label: "Parameter Type",
		required: true,
		type: "SELECT",
		options: [
			{ value: "RECORD", label: "Record ID" },
			{ value: "TEXT", label: "Text" },
		],
	},
	{
		name: "collection",
		label: "Collection",
		type: "METADATA",
		metadataType: "COLLECTION",
		displayConditions: [{ field: "type", operator: "EQ", value: "RECORD" }],
	},
] as ComponentProperty[]

const ParamProperties: definition.UtilityComponent = (props) => {
	const { context } = props
	const path = useSelectedPath(context)

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={path}
			title={"Param Properties"}
		>
			<PropertiesForm
				id={path.combine()}
				context={context}
				properties={paramProperties}
				path={path}
			/>
		</PropertiesWrapper>
	)
}

ParamProperties.displayName = "ParamProperties"

export default ParamProperties
