import { component, definition, wire } from "@uesio/ui"
import {
	ComponentProperty,
	ListPropertyActionOptions,
	ListPropertyItemChildrenFunction,
	ListPropertyItemChildrenFunctionOptions,
} from "./componentproperty"
import { add, get } from "../api/defapi"
import { getSelectedPath } from "../api/stateapi"
import ListPropertyItem from "../utilities/listpropertyitem/listpropertyitem"

export const getDisplayConditionProperties = (
	condition: component.DisplayCondition
) =>
	condition.type === "group"
		? GroupDisplayConditionProperties
		: DisplayConditionProperties

const GroupDisplayConditionProperties: ComponentProperty[] = [
	{
		name: "conjunction",
		type: "SELECT",
		label: "Display if...",
		options: [
			{
				label: "ALL conditions are satsified",
				value: "AND",
			},
			{
				label: "ANY condition is satisfied",
				value: "OR",
			},
		],
	},
]

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
		case "group":
			return `${condition.type.toLocaleUpperCase()}: ${
				condition.conjunction
			}`
	}
	return `${condition.type}${details ? ": " + details : ""}`
}

const addCondition =
	(defaultDefinition: definition.DefinitionMap) =>
	({ context, path, items }: ListPropertyActionOptions) => {
		const selectedPath = getSelectedPath(context)
		let conditionsArray = items
		let targetPath = path
		// If the selected path is a Group, add the condition to the group
		if (
			(get(context, selectedPath) as component.DisplayCondition)?.type ===
			"group"
		) {
			targetPath = selectedPath.addLocal("conditions")
			conditionsArray = get(
				context,
				targetPath
			) as component.DisplayCondition[]
		}
		add(
			context,
			targetPath.addLocal(`${conditionsArray?.length || 0}`),
			defaultDefinition
		)
	}

const getDisplayConditionChildren = (
	options: ListPropertyItemChildrenFunctionOptions
) => {
	const { context, item, path, index } = options
	const displayCondition = item as component.DisplayCondition
	const isGroup = displayCondition.type === "group"
	const groupConditions =
		isGroup && displayCondition.conditions?.length > 0
			? displayCondition.conditions
			: []
	return (
		<>
			{groupConditions.map(
				(
					conditionOnGroup: component.DisplayCondition,
					secindex: number
				) => {
					const conditionOnGroupPath = path.addLocal("conditions")
					return (
						<ListPropertyItem
							key={index + "." + secindex}
							context={context.addRecordDataFrame(
								conditionOnGroup as wire.PlainWireRecord,
								secindex
							)}
							parentPath={conditionOnGroupPath}
							displayTemplate={getDisplayConditionLabel(
								conditionOnGroup
							)}
							itemProperties={(itemState: wire.PlainWireRecord) =>
								getDisplayConditionProperties(
									itemState as component.DisplayCondition
								)
							}
							itemPropertiesPanelTitle="Condition Properties"
							itemChildren={
								getDisplayConditionChildren as ListPropertyItemChildrenFunction
							}
						/>
					)
				}
			)}
		</>
	)
}

/**
 * Define the properties that should be shown for a DISPLAY (Display Conditions) section
 * requested for a Properties form
 * @param selectedSectionId string
 * @returns
 */
export const getDisplaySectionProperties = (
	selectedSectionId: string
): ComponentProperty[] => [
	{
		name: selectedSectionId,
		type: "LIST",
		items: {
			properties: (record: wire.PlainWireRecord) =>
				getDisplayConditionProperties(
					record as component.DisplayCondition
				),
			displayTemplate: (record: wire.PlainWireRecord) =>
				getDisplayConditionLabel(record as component.DisplayCondition),
			actions: [
				{
					label: "New Condition",
					action: addCondition({
						type: "fieldValue",
						operator: "EQUALS",
					}),
				},
				{
					label: "New Group",
					action: addCondition({
						type: "group",
						conjunction: "OR",
						conditions: [
							{
								type: "fieldValue",
								operator: "EQUALS",
							},
						],
					}),
				},
			],
			title: "Condition Properties",
			children: getDisplayConditionChildren,
		},
	},
]
