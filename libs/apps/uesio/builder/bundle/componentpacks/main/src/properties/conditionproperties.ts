import { ComponentProperty } from "./componentproperty"

export const ConditionProperties: ComponentProperty[] = [
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
		displayConditions: [
			{
				field: "type",
				operator: "INCLUDES",
				value: ["fieldValue", "wireHasChanges", "wireHasNoChanges"],
				type: "fieldValue",
			},
		],
	},

	{
		name: "field",
		type: "METADATA",
		metadataType: "FIELD",
		label: "Field",
		groupingPath: "../../collection",
		displayConditions: [
			{
				field: "type",
				operator: "EQUALS",
				value: "fieldValue",
				type: "fieldValue",
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
		displayConditions: [
			{
				field: "type",
				operator: "INCLUDES",
				value: ["fieldValue", "paramValue"],
				type: "fieldValue",
			},
		],
	},
	{
		name: "param",
		type: "PARAM",
		label: "Param",
		displayConditions: [
			{
				field: "type",
				operator: "INCLUDES",
				value: ["paramValue", "paramIsSet"],
				type: "fieldValue",
			},
		],
	},
	{
		name: "value",
		type: "TEXT",
		label: "Value",
		displayConditions: [
			{
				field: "type",
				operator: "INCLUDES",
				value: ["paramValue", "fieldValue", "hasNoValue", "hasValue"],
				type: "fieldValue",
			},
		],
	},
	{
		type: "METADATA",
		name: "collection",
		metadataType: "COLLECTION",
		label: "Collection",
		displayConditions: [
			{
				field: "type",
				operator: "EQUALS",
				value: ["collectionContext"],
				type: "fieldValue",
			},
		],
	},
	{
		name: "name",
		type: "TEXT", //TO-DO FFlag type
		label: "Name",
		displayConditions: [
			{
				field: "type",
				operator: "EQUALS",
				value: ["featureFlag"],
				type: "fieldValue",
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
		displayConditions: [
			{
				field: "type",
				operator: "EQUALS",
				value: ["fieldMode"],
				type: "fieldValue",
			},
		],
	},
]

export default ConditionProperties
