import { definition } from "@uesio/ui"
import PropertiesForm from "../../../helpers/propertiesform"
import { useSelectedPath } from "../../../api/stateapi"
import { ComponentProperty } from "../../../properties/componentproperty"

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
			{ value: "CHECKBOX", label: "Checkbox" },
			{ value: "NUMBER", label: "Number" },
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
		<PropertiesForm
			title={"Param Properties"}
			id={path.combine()}
			context={context}
			properties={paramProperties}
			path={path}
		/>
	)
}

ParamProperties.displayName = "ParamProperties"

export default ParamProperties
