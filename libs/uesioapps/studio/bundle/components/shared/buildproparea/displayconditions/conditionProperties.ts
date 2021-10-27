import { builder } from "@uesio/ui"

export const paramIsValue: builder.PropDescriptor[] = [
	{
		name: "type",
		type: "SELECT",
		label: "Type",
		options: [
			{
				label: "Param is set",
				value: "paramIsSet",
			},
		],
	},
	{
		name: "field",
		type: "METADATA",
		metadataType: "FIELD",
		label: "Field",
		groupingParents: 2,
		groupingProperty: "collection",
		display: [
			{
				property: "type",
				values: ["fieldHasValue", "ParamHasValue"],
			},
		],
	},
	{
		name: "value",
		type: "TEXT",
		label: "Value",
	},
]

export const fieldIsValue = paramIsValue
export const paramIsSet = paramIsValue

export default { fieldIsValue, paramIsValue, paramIsSet }
