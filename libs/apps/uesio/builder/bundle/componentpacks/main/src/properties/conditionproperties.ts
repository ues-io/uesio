import { component } from "@uesio/ui"
import { ComponentProperty } from "./componentproperty"

export const DisplayConditionProperties: ComponentProperty[] = [
	{
		name: "type",
		type: "SELECT",
		label: "Value Source",
		options: [
			{
				label: "Select an option",
				value: "",
			},
			{
				label: "Wire field value",
				value: "fieldValue",
			},
			{
				label: "View Param is set",
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
		label: "Wire",
		displayConditions: [
			{
				field: "type",
				operator: "IN",
				values: ["fieldValue", "wireHasChanges", "wireHasNoChanges"],
				type: "fieldValue",
			},
		],
	},
	{
		name: "field",
		type: "FIELD",
		wireField: "wire",
		label: "Field",
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
			{
				label: "IN",
				value: "IN",
			},
			{
				label: "NOT_IN",
				value: "NOT_IN",
			},
		],

		displayConditions: [
			{
				field: "type",
				operator: "IN",
				values: ["fieldValue", "paramValue"],
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
				operator: "IN",
				values: ["paramValue", "paramIsSet"],
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
				operator: "IN",
				values: ["paramValue", "fieldValue", "hasNoValue", "hasValue"],
				type: "fieldValue",
			},
			{
				field: "operator",
				operator: "NOT_IN",
				values: ["IN", "NOT_IN"],
				type: "fieldValue",
			},
		],
	},
	{
		name: "values",
		type: "LIST",
		label: "Values",
		subtype: "TEXT",
		displayConditions: [
			{
				field: "type",
				operator: "EQUALS",
				type: "fieldValue",
				value: "fieldValue",
			},
			{
				field: "operator",
				operator: "IN",
				type: "fieldValue",
				values: ["IN", "NOT_IN"],
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
				value: "collectionContext",
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
				value: "featureFlag",
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
				value: "fieldMode",
				type: "fieldValue",
			},
		],
	},
]

const getShortOperator = (operator: component.DisplayOperator) =>
	({
		EQUALS: "=",
		NOT_EQUALS: "!=",
		IN: "in",
		NOT_IN: "not in",
	}[operator || "EQUALS"])

export const getDisplayConditionLabel = (
	condition: component.DisplayCondition
): string => {
	if (!condition.type) return "New Condition"
	let details = ""
	switch (condition.type) {
		case "fieldValue":
			details =
				(condition.field || "[No Field]") +
				" " +
				getShortOperator(condition.operator) +
				" "
			if (condition.value) details += condition.value
			else if (condition.values)
				details += condition.values.length + " values"
			else details += " [No Value]"
			break
		case "fieldMode":
			details = condition.mode || "[No mode]"
			break
		case "paramValue":
			details = `${condition.param || "No Param"} = ${
				condition.value || "[No Value]"
			}`
			break
	}
	return `${condition.type}${details ? ": " + details : ""}`
}
