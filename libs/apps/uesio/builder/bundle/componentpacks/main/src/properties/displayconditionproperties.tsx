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
		label: "Condition Type",
		options: [
			{
				label: "",
				value: "",
			},
			{
				label: "Wire",
				value: "wireRelatedOptions",
				options: [
					{
						label: "Wire field value",
						value: "fieldValue",
					},
					{
						label: "Wire has changes",
						value: "wireHasChanges",
					},
					{
						label: "Wire has no changes",
						value: "wireHasNoChanges",
					},
					{
						label: "Wire is loading",
						value: "wireIsLoading",
					},
					{
						label: "Wire is not loading",
						value: "wireIsNotLoading",
					},
					{
						label: "Wire has loaded all records",
						value: "wireHasLoadedAllRecords",
					},
					{
						label: "Wire has more records to load",
						value: "wireHasMoreRecordsToLoad",
					},
					{
						label: "Wire has no records",
						value: "wireHasNoRecords",
					},
					{
						label: "Wire has records",
						value: "wireHasRecords",
					},
					{
						label: "Wire has search condition",
						value: "wireHasSearchCondition",
					},
					{
						label: "Wire has no search condition",
						value: "wireHasNoSearchCondition",
					},
					{
						label: "Wire has active conditions",
						value: "wireHasActiveConditions",
					},
					{
						label: "Wire has no active conditions",
						value: "wireHasNoActiveConditions",
					},
					{
						label: "Record is new",
						value: "recordIsNew",
					},
					{
						label: "Record is not new",
						value: "recordIsNotNew",
					},
				],
				disabled: true,
			},
			{
				label: "Params",
				value: "paramRelatedOptions",
				options: [
					{
						label: "View Param is set",
						value: "paramIsSet",
					},
					{
						label: "View Param is not set",
						value: "paramIsNotSet",
					},
					{
						label: "Param equals",
						value: "paramValue",
					},
				],
			},
			{
				label: "Merges",
				value: "mergesRelatedOptions",
				options: [
					{
						label: "Merge value comparison",
						value: "mergeValue",
					},
					{
						label: "Merge value is empty",
						value: "hasNoValue",
					},
					{
						label: "Merge value is not empty",
						value: "hasValue",
					},
				],
			},
			{
				label: "Others",
				value: "othersRelatedOptions",
				options: [
					{
						label: "Collection context",
						value: "collectionContext",
					},
					{
						label: "Feature Flag value",
						value: "featureFlag",
					},
					{
						label: "Field Mode",
						value: "fieldMode",
					},
					{
						label: "Has profile",
						value: "hasProfile",
					},
				],
			},
		],
		onChange: [
			{
				// If type no longer needs a Param, clear out "param"
				conditions: [
					{
						field: "type",
						operator: "NOT_IN",
						values: ["paramValue", "paramIsSet", "paramIsNotSet"],
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "param",
					},
				],
			},
			{
				// If type no longer needs a Wire, clear out "wire"
				conditions: [
					{
						field: "type",
						operator: "NOT_IN",
						values: [
							"fieldValue",
							"wireHasChanges",
							"wireHasNoChanges",
							"wireIsLoading",
							"wireIsNotLoading",
							"wireHasLoadedAllRecords",
							"wireHasMoreRecordsToLoad",
							"wireHasNoRecords",
							"wireHasRecords",
							"wireHasSearchCondition",
							"wireHasNoSearchCondition",
						],
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "wire",
					},
				],
			},
			{
				// If type is no longer fieldValue, clear out field and values
				conditions: [
					{
						field: "type",
						operator: "NOT_EQUALS",
						value: "fieldValue",
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "field",
					},
					{
						field: "values",
					},
				],
			},
			{
				// If type no longer needs "value", clear out "value"
				conditions: [
					{
						field: "type",
						operator: "NOT_IN",
						values: [
							"paramValue",
							"fieldValue",
							"hasNoValue",
							"hasValue",
							"mergeValue",
						],
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "value",
					},
				],
			},
			{
				// If type is no longer collectionContext, clear out collection
				conditions: [
					{
						field: "type",
						operator: "NOT_EQUALS",
						value: "collectionContext",
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "collection",
					},
				],
			},
			{
				// If type is no longer featureFlag, clear out name
				conditions: [
					{
						field: "type",
						operator: "NOT_EQUALS",
						value: "featureFlag",
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "name",
					},
				],
			},
			{
				// If type is no longer fieldMode, clear out mode
				conditions: [
					{
						field: "type",
						operator: "NOT_EQUALS",
						value: "fieldMode",
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "mode",
					},
				],
			},
			{
				// If type is no longer "mergeValue", clear out "sourceValue"
				conditions: [
					{
						type: "fieldValue",
						field: "operator",
						operator: "NOT_EQUALS",
						value: "mergeValue",
					},
				],
				updates: [
					{
						field: "sourceValue",
					},
				],
			},
			{
				// If type is no longer hasProfile, clear out profile
				conditions: [
					{
						field: "type",
						operator: "NOT_EQUALS",
						value: "hasProfile",
						type: "fieldValue",
					},
				],
				updates: [
					{
						field: "profile",
					},
				],
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
				values: [
					"fieldValue",
					"wireHasChanges",
					"wireHasNoChanges",
					"wireIsLoading",
					"wireIsNotLoading",
					"wireHasLoadedAllRecords",
					"wireHasMoreRecordsToLoad",
					"wireHasNoRecords",
					"wireHasRecords",
					"wireHasSearchCondition",
					"wireHasNoSearchCondition",
					"wireHasActiveConditions",
					"wireHasNoActiveConditions",
				],
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
		name: "sourceValue",
		type: "TEXT",
		label: "Source Value",
		displayConditions: [
			{
				field: "type",
				operator: "IN",
				values: ["mergeValue"],
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
				values: ["fieldValue", "paramValue", "mergeValue"],
				type: "fieldValue",
			},
		],
		onChange: [
			{
				// If operator is NOW a multi-value operator, clear out "value"
				conditions: [
					{
						type: "fieldValue",
						field: "operator",
						operator: "IN",
						values: ["IN", "NOT_IN"],
					},
				],
				updates: [
					// Set "value" to undefined
					{
						field: "value",
					},
				],
			},
			{
				// If operator is now a single-value operator, clear out "values"
				conditions: [
					{
						type: "fieldValue",
						field: "operator",
						operator: "NOT_IN",
						values: ["IN", "NOT_IN"],
					},
				],
				updates: [
					// Set "values" to undefined
					{
						field: "values",
					},
				],
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
				values: ["paramValue", "paramIsSet", "paramIsNotSet"],
				type: "fieldValue",
			},
		],
	},
	{
		name: "value",
		type: "FIELD_VALUE",
		wireProperty: "wire",
		fieldProperty: "field",
		label: "Value",
		displayConditions: [
			{
				field: "type",
				operator: "IN",
				values: [
					"paramValue",
					"fieldValue",
					"hasNoValue",
					"hasValue",
					"mergeValue",
				],
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
		type: "FIELD_VALUES",
		label: "Values",
		wireProperty: "wire",
		fieldProperty: "field",
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
	{
		type: "METADATA",
		name: "profile",
		metadataType: "PROFILE",
		label: "Profile",
		displayConditions: [
			{
				field: "type",
				operator: "EQUALS",
				value: "hasProfile",
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
		case "paramIsSet":
		case "paramIsNotSet":
			details = `${condition.param || "No Param"}`
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
