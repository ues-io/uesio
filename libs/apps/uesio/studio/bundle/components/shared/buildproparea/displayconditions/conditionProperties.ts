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
				value: "fieldValue",
			},
			{
				label: "Param equals",
				value: "paramValue",
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
				value: "fieldValue",
			},
		],
	},
	{
		name: "param",
		type: "TEXT",
		label: "Param",
		display: [
			{
				type: "INCLUDES",
				property: "type",
				values: ["paramValue", "paramIsSet"],
			},
		],
	},
	{
		name: "value",
		type: "TEXT",
		label: "Value",
		display: [
			{
				type: "INCLUDES",
				property: "type",
				values: ["paramValue", "fieldValue"],
			},
		],
	},
]

export default properties
