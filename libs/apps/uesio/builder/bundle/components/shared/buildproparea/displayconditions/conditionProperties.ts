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
				label: "Field equals",
				value: "fieldValue",
			},
			{
				label: "Param is set",
				value: "paramIsSet",
			},
			{
				label: "Param equals",
				value: "paramValue",
			},
			{
				label: "Has No Value",
				value: "hasNoValue",
			},
			{
				label: "Has Value",
				value: "hasValue",
			},
			{
				label: "Collection Context",
				value: "collectionContext",
			},
			{
				label: "Feature Flag",
				value: "featureFlag",
			},
			{
				label: "Field Mode",
				value: "fieldMode",
			},
			{
				label: "Wire has changes",
				value: "wireHasChanges",
			},
			{
				label: "Wire has no changes",
				value: "wireHasNoChanges",
			},
		],
	},
	{
		name: "wire",
		type: "WIRE",
		label: "wire",
		display: [
			{
				type: "INCLUDES",
				property: "type",
				values: ["fieldValue", "wireHasChanges", "wireHasNoChanges"],
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
		name: "operator",
		type: "SELECT",
		label: "Operator",
		options: [
			{
				label: "Select an option",
				value: "",
			},
			{
				label: "EQUALS",
				value: "EQUALS",
			},
			{
				label: "NOT_EQUALS",
				value: "NOT_EQUALS",
			},
		],
		display: [
			{
				type: "INCLUDES",
				property: "type",
				values: ["fieldValue", "paramValue"],
			},
		],
	},
	{
		name: "param",
		type: "PARAM",
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
				values: ["paramValue", "fieldValue", "hasNoValue", "hasValue"],
			},
		],
	},
	{
		type: "METADATA",
		name: "collection",
		metadataType: "COLLECTION",
		label: "Collection",
		display: [
			{
				property: "type",
				value: "collectionContext",
			},
		],
	},
	{
		name: "name",
		type: "TEXT", //TO-DO FFlag type
		label: "Name",
		display: [
			{
				property: "type",
				value: "featureFlag",
			},
		],
	},
	{
		name: "mode",
		type: "SELECT",
		label: "Mode",
		options: [
			{
				label: "Select an option",
				value: "",
			},
			{
				label: "READ",
				value: "READ",
			},
			{
				label: "EDIT",
				value: "EDIT",
			},
		],
		display: [
			{
				property: "type",
				value: "fieldMode",
			},
		],
	},
]

export default properties
