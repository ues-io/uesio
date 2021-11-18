import { builder } from "@uesio/ui"

export const properties: builder.PropDescriptor[] = [
	{
		name: "type",
		type: "SELECT",
		label: "Type",
		options: [
			{
				label: "Select an option",
				value: "",
			},
			{
				label: "Param is set",
				value: "paramIsSet",
			},
			{
				label: "Field equals",
				value: "fieldIsValue",
			},
			{
				label: "Param equals",
				value: "paramIsValue",
			},
		],
	},
	{
		name: "field",
		type: "METADATA",
		metadataType: "FIELD",
		label: "Field",
		groupingParents: 2,
		groupingProperty: "collection", // Todo, needs a fix to work in the usecase here
		display: [
			{
				property: "type",
				values: ["fieldIsValue"],
			},
		],
	},
	{
		name: "param",
		type: "TEXT",
		label: "Param",
		display: [
			{
				property: "type",
				values: ["paramIsValue", "paramIsSet"],
			},
		],
	},
	{
		name: "value",
		type: "TEXT",
		label: "Value",
		display: [
			{
				property: "type",
				values: ["paramIsValue", "fieldIsValue"],
			},
		],
	},
]

export default properties
