import {
	definition,
	component,
	wire,
	collection,
	context,
	api,
} from "@uesio/ui"
import { add, get } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"
import { useSelectedPath } from "../../../../api/stateapi"
import { getFieldMetadata } from "../../../../api/wireapi"
import * as prop from "../../../../properties/componentproperty"
import * as operators from "../../../shared/operatorproperties"
import { WireConditionState } from "libs/ui/src/wireexports"

function getConditionPropertiesPanelTitle(
	condition: wire.WireConditionState
): string {
	return `${condition.type === "GROUP" ? "Group " : ""} Condition Properties`
}

const multiValueOperators = ["HAS_ANY", "HAS_ALL", "IN", "NOT_IN"]
const ValueOperators = [
	"EQ",
	"NOT_EQ",
	"GT",
	"LT",
	"GTE",
	"LTE",
	"CONTAINS",
	"START_WITH",
]

function getConditionTitle(condition: wire.WireConditionState): string {
	if (condition.type === "GROUP" && !condition.valueSource) {
		return `GROUP ${condition.conjunction}`
	}

	if (condition.valueSource === "VALUE") {
		const valueCondition = condition as wire.ValueConditionState
		const valuesString = valueCondition.values
			? "(" + valueCondition.values.join(",") + ")"
			: valueCondition.value
		return `${valueCondition.field} ${valueCondition.operator || ""} ${
			valuesString || ""
		}`
	}

	if (condition.valueSource === "PARAM") {
		const valueCondition = condition as wire.ParamConditionState
		const valuesString = valueCondition.params
			? "(" + valueCondition.params.join(",") + ")"
			: valueCondition.param
		return `${valueCondition.field} ${
			valueCondition.operator || ""
		} Param{${valuesString}}`
	}

	if (condition.valueSource === "LOOKUP") {
		const valueCondition = condition as wire.LookupConditionState
		return `${valueCondition.field} ${
			valueCondition.operator || ""
		} Lookup{${valueCondition.lookupWire || ""}.${
			valueCondition.lookupField || ""
		}}`
	}

	if (condition.type === "SEARCH") {
		return `SEARCH`
	}

	return "NEW_VALUE"
}

function getOperatorOptions(
	fieldDisplayType: string | undefined,
	condition: WireConditionState
) {
	let o = operators
	let options = [{ label: "", value: "" }]
	let valueSource = condition?.valueSource
	if (fieldDisplayType && valueSource) {
		switch (valueSource) {
			case "LOOKUP": {
				return options.concat(o.INNOTIN)
			}
			case "PARAM": {
				switch (fieldDisplayType) {
					case "EMAIL":
					case "LIST":
					case "REFERENCE":
					case "SELECT":
					case "AUTONUMBER": {
						return options.concat(o.EQNOTEQ, o.INNOTIN)
					}
					case "NUMBER":
					case "TIMESTAMP":
					case "DATE": {
						return options.concat(
							o.EQNOTEQ,
							o.GTLT,
							o.GTELTE,
							o.INNOTIN
						)
					}
					case "TEXT":
					case "LONGTEXT": {
						return options.concat(o.EQNOTEQ, [
							o.STARTWITH,
							o.CONTAINS,
						])
					}
					case "REFERENCEGROUP":
					case "MULTISELECT": {
						return options.concat(o.ANYHASALL)
					}
					default:
						return options.concat(o.EQNOTEQ)
				}
			}
			case "VALUE": {
				switch (fieldDisplayType) {
					case "EMAIL":
					case "LIST":
					case "REFERENCE":
					case "SELECT":
					case "AUTONUMBER": {
						return options.concat(
							o.EQNOTEQ,
							o.INNOTIN,
							o.BLANKNOTBLANK
						)
					}
					case "FILE":
					case "STRUCT":
					case "CHECKBOX": {
						return options.concat(o.EQNOTEQ, o.BLANKNOTBLANK)
					}
					case "NUMBER":
					case "TIMESTAMP":
					case "DATE": {
						return options.concat(
							o.EQNOTEQ,
							o.GTLT,
							o.GTELTE,
							o.INNOTIN,
							o.BLANKNOTBLANK,
							[o.BETWEEN]
						)
					}
					case "LONGTEXT":
					case "TEXT": {
						return options.concat(
							o.EQNOTEQ,
							[o.STARTWITH, o.CONTAINS],
							o.BLANKNOTBLANK
						)
					}
					case "MULTISELECT": {
						return options.concat(o.ANYHASALL, o.BLANKNOTBLANK)
					}
					case "REFERENCEGROUP": {
						return options.concat(o.ANYHASALL)
					}
					default:
						return options.concat(o.EQNOTEQ)
				}
			}
		}
	}
	return []
}

function getValueProperty({
	fieldDisplayType,
	fieldMetadata,
	context,
}: {
	fieldDisplayType: wire.FieldType | undefined
	fieldMetadata: collection.Field | undefined
	context: context.Context
}):
	| prop.TextProperty
	| prop.NumberProperty
	| prop.CheckboxProperty
	| prop.SelectProperty
	| prop.DateProperty
	| prop.TimestampProperty {
	// TODO: Add additional property types here to support things like DATE

	const baseValueProp = {
		name: "value",
		label: "Value",
		displayConditions: [
			{
				type: "fieldValue",
				field: "operator",
				operator: "NOT_IN",
				values: multiValueOperators.concat(["BETWEEN"]),
			},
			{
				type: "fieldValue",
				field: "operator",
				operator: "IN",
				values: ValueOperators,
			},
		],
	}
	if (fieldDisplayType === "CHECKBOX") {
		return {
			...baseValueProp,
			type: "CHECKBOX",
		} as prop.CheckboxProperty
	}

	if (fieldDisplayType === "NUMBER") {
		return { ...baseValueProp, type: "NUMBER" } as prop.NumberProperty
	}

	if (fieldDisplayType === "DATE") {
		return { ...baseValueProp, type: "DATE" } as prop.DateProperty
	}

	if (fieldDisplayType === "TIMESTAMP") {
		return {
			...baseValueProp,
			type: "TIMESTAMP",
		} as prop.TimestampProperty
	}

	if (fieldDisplayType === "SELECT") {
		return {
			...baseValueProp,
			type: "SELECT",
			options: fieldMetadata?.getSelectOptions(context),
		} as prop.SelectProperty
	}

	return { ...baseValueProp, type: "TEXT" } as prop.TextProperty
}

const ConditionsProperties: definition.UC = (
	props,
	condition: WireConditionState
) => {
	const { context } = props
	const ListPropertyUtility = component.getUtility(
		"uesio/builder.listproperty"
	)
	const ListPropertyItem = component.getUtility(
		"uesio/builder.listpropertyitem"
	)

	const propertyName = "conditions"
	const selectedPath = useSelectedPath(context)
	const selectedPathSize = selectedPath ? selectedPath.size() : null
	const wirePath = selectedPath.trimToSize(2)
	const conditionsPath = wirePath.addLocal(propertyName)
	const [wireName] = wirePath.pop()
	const items = get(context, conditionsPath) as wire.WireConditionState[]
	const conditions = api.wire.useWire(wireName, context)?.getConditions()
	const mainConditionId = selectedPath
		.trimToSize(4)
		.pop()[0]
		?.valueOf() as string

	const getCondition = () => {
		if (conditions && selectedPathSize) {
			if (selectedPathSize > 4) {
				let subConditionId = selectedPath.pop()[0]?.valueOf() as string
				let subConditionsPath = selectedPath.trimToSize(5)
				let subConditions = get(
					context,
					subConditionsPath
				) as wire.WireConditionState[]
				return subConditions[parseInt(subConditionId)]
			} else {
				return condition
					? conditions[parseInt(mainConditionId)]
					: condition
			}
		}
	}

	const selectedCondition = getCondition() || condition

	const getProperties = (
		parentPath: FullPath,
		itemState: wire.PlainWireRecord
	): prop.ComponentProperty[] => {
		const fieldMetadata =
			itemState.field && wireName
				? getFieldMetadata(
						context,
						wireName as string,
						itemState.field as string
				  )
				: undefined
		const fieldDisplayType = fieldMetadata?.getType() || undefined

		return [
			{
				name: "id",
				type: "TEXT",
				label: "Condition Id",
			},
			{
				name: "field",
				type: "METADATA",
				metadataType: "FIELD",
				label: "Field",
				groupingPath: `${"../".repeat(
					parentPath.size() - 3
				)}../collection`,
				displayConditions: [
					{
						operator: "NOT_EQUALS",
						field: "type",
						value: "GROUP",
						type: "fieldValue",
					},
				],
				onChange: [
					{
						// Clear out all of these wire condition properties whenever field is changed
						updates: [
							"operator",
							"value",
							"values",
							"start",
							"end",
							"inclusiveStart",
							"inclusiveEnd",
						].map((field) => ({ field })),
					},
				],
			},
			{
				name: "valueSource",
				type: "SELECT",
				label: "Value Source",
				options: [
					{
						label: "",
						value: "",
					},
					{
						label: "Value",
						value: "VALUE",
					},
					{
						label: "Lookup",
						value: "LOOKUP",
					},
					{
						label: "Param",
						value: "PARAM",
					},
				],
				displayConditions: [
					{
						operator: "NOT_EQUALS",
						field: "type",
						value: "GROUP",
						type: "fieldValue",
					},
				],
				onChange: [
					// Clear out value if operator IS NOW a multi-value operator
					{
						updates: [
							{
								field: "operator",
								value: "",
							},
						],
					},
				],
			},
			{
				name: "lookupWire",
				type: "WIRE",
				label: "Lookup Wire",
				displayConditions: [
					{
						field: "valueSource",
						value: "LOOKUP",
						type: "fieldValue",
						operator: "EQUALS",
					},
				],
			},
			{
				name: "lookupField",
				type: "FIELD",
				label: "Lookup Field",
				wireField: "lookupWire",
				displayConditions: [
					{
						field: "valueSource",
						value: "LOOKUP",
						type: "fieldValue",
						operator: "EQUALS",
					},
					{
						operator: "NOT_EQUALS",
						field: "lookupWire",
						value: "",
						type: "fieldValue",
					},
				],
			},
			{
				name: "operator",
				type: "SELECT",
				label: "Operator",
				options: getOperatorOptions(
					fieldDisplayType,
					selectedCondition
				),
				displayConditions: [
					{
						operator: "EQUALS",
						field: "conjunction",
						value: "",
						type: "fieldValue",
					},
					{
						operator: "NOT_EQUALS",
						field: "field",
						value: "",
						type: "fieldValue",
					},
					{
						operator: "NOT_EQUALS",
						field: "valueSource",
						value: "",
						type: "fieldValue",
					},
				],
				onChange: [
					// Clear out value if operator IS NOW a multi-value operator
					{
						updates: [
							{
								field: "value",
							},
						],
						conditions: [
							{
								field: "operator",
								operator: "IN",
								values: multiValueOperators,
								type: "fieldValue",
							},
						],
					},
					// Clear out param if operator IS NOW a multi-value operator
					{
						updates: [
							{
								field: "param",
							},
						],
						conditions: [
							{
								field: "operator",
								operator: "IN",
								values: multiValueOperators,
								type: "fieldValue",
							},
						],
					},
					// Clear out values (PLURAL) if operator IS NO LONGER a multi-value operator
					{
						updates: [
							{
								field: "values",
							},
						],
						conditions: [
							{
								field: "operator",
								operator: "NOT_IN",
								values: multiValueOperators,
								type: "fieldValue",
							},
						],
					},
					// Clear out params (PLURAL) if operator IS NO LONGER a multi-value operator
					{
						updates: [
							{
								field: "params",
							},
						],
						conditions: [
							{
								field: "operator",
								operator: "NOT_IN",
								values: multiValueOperators,
								type: "fieldValue",
							},
						],
					},
					// Clear out special BETWEEN properties if operator is not BETWEEN
					{
						conditions: [
							{
								field: "operator",
								operator: "NOT_EQUALS",
								value: "BETWEEN",
								type: "fieldValue",
							},
						],
						updates: [
							"start",
							"end",
							"inclusiveStart",
							"inclusiveEnd",
						].map((field) => ({ field })),
					},
				],
			},
			{
				name: "start",
				type: "TEXT",
				label: "Start",
				displayConditions: [
					{
						field: "valueSource",
						value: "VALUE",
						type: "fieldValue",
						operator: "EQUALS",
					},
					{
						type: "fieldValue",
						operator: "EQUALS",
						field: "operator",
						value: "BETWEEN",
					},
				],
			},
			{
				name: "end",
				type: "TEXT",
				label: "End",
				displayConditions: [
					{
						field: "valueSource",
						value: "VALUE",
						type: "fieldValue",
						operator: "EQUALS",
					},
					{
						type: "fieldValue",
						operator: "EQUALS",
						field: "operator",
						value: "BETWEEN",
					},
				],
			},
			{
				name: "inclusiveStart",
				type: "CHECKBOX",
				label: "Inclusive Start",
				displayConditions: [
					{
						field: "valueSource",
						value: "VALUE",
						type: "fieldValue",
						operator: "EQUALS",
					},
					{
						type: "fieldValue",
						operator: "EQUALS",
						field: "operator",
						value: "BETWEEN",
					},
				],
			},
			{
				name: "inclusiveEnd",
				type: "CHECKBOX",
				label: "Inclusive End",
				displayConditions: [
					{
						field: "valueSource",
						value: "VALUE",
						type: "fieldValue",
						operator: "EQUALS",
					},
					{
						type: "fieldValue",
						operator: "EQUALS",
						field: "operator",
						value: "BETWEEN",
					},
				],
			},
			{
				...getValueProperty({
					fieldDisplayType,
					fieldMetadata,
					context,
				}),
			},
			{
				name: "values",
				type: "LIST",
				label: "Values",
				subtype: fieldDisplayType,
				subtypeOptions:
					fieldDisplayType === "CHECKBOX"
						? [
								{ label: "True", value: "true" },
								{ label: "False", value: "false" },
						  ]
						: fieldMetadata?.getSelectOptions(context),
				displayConditions: [
					{
						field: "operator",
						type: "fieldValue",
						operator: "IN",
						values: multiValueOperators,
					},
					{
						field: "valueSource",
						type: "fieldValue",
						operator: "NOT_EQUALS",
						value: "LOOKUP",
					},
				],
			},
			{
				name: "inactive",
				type: "CHECKBOX",
				label: "Inactive by default",
			},

			{
				name: "params",
				type: "LIST",
				label: "Params",
				subtype: fieldDisplayType,
				displayConditions: [
					{
						field: "valueSource",
						value: "PARAM",
						type: "fieldValue",
						operator: "EQUALS",
					},
					{
						field: "operator",
						type: "fieldValue",
						operator: "IN",
						values: multiValueOperators,
					},
					{
						operator: "NOT_EQUALS",
						field: "id",
						value: "",
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
						field: "valueSource",
						value: "PARAM",
						type: "fieldValue",
						operator: "EQUALS",
					},
					{
						field: "operator",
						type: "fieldValue",
						operator: "NOT_IN",
						values: multiValueOperators,
					},
					{
						operator: "NOT_EQUALS",
						field: "id",
						value: "",
						type: "fieldValue",
					},
				],
			},
			{
				name: "type",
				type: "SELECT",
				label: "Type",
				options: [
					{
						label: "Group",
						value: "GROUP",
					},
				],
				displayConditions: [
					{
						field: "type",
						value: "GROUP",
						type: "fieldValue",
						operator: "EQUALS",
					},
				],
			},
			{
				name: "conjunction",
				type: "SELECT",
				label: "Conjunction",
				options: [
					{
						label: "AND",
						value: "AND",
					},
					{
						label: "OR",
						value: "OR",
					},
				],
				displayConditions: [
					{
						field: "type",
						value: "GROUP",
						type: "fieldValue",
						operator: "EQUALS",
					},
				],
			},
		]
	}

	const defaultConditionDef = {}

	const defaultConditionGroupDef = {
		type: "GROUP",
		conjunction: "AND",
		conditions: [defaultConditionDef],
	}

	return (
		<>
			<ListPropertyUtility
				context={context}
				path={conditionsPath}
				actions={[
					{
						label: "Add Group",
						action: () => {
							add(
								context,
								conditionsPath.addLocal(
									`${items?.length || 0}`
								),
								defaultConditionGroupDef
							)
						},
					},
					{
						label: "Add Condition",
						action: () => {
							let targetPath = conditionsPath
							let conditionsArray = items
							// If the selected path is a Group, add the condition to the group
							if (
								(
									get(
										context,
										selectedPath
									) as wire.WireConditionState
								)?.type === "GROUP"
							) {
								targetPath = selectedPath.addLocal("conditions")
								conditionsArray = get(
									context,
									targetPath
								) as wire.WireConditionState[]
							}
							add(
								context,
								targetPath.addLocal(
									`${conditionsArray?.length || 0}`
								),
								defaultConditionDef
							)
						},
					},
				]}
				items={items}
				itemProperties={(itemState: wire.PlainWireRecord) =>
					getProperties(conditionsPath, itemState)
				}
				itemDisplayTemplate={getConditionTitle}
				itemPropertiesPanelTitle={getConditionPropertiesPanelTitle}
				itemChildren={(
					item: wire.WireConditionState,
					index: number
				) => {
					const isGroup = item.type === "GROUP"
					const groupConditions =
						isGroup && !item.valueSource ? item.conditions : null
					return (
						!!groupConditions &&
						groupConditions.map(
							(
								conditionOnGroup: wire.WireConditionState,
								secindex
							) => {
								const conditionOnGroupPath = conditionsPath
									.addLocal(index.toString())
									.addLocal(propertyName)

								return (
									<ListPropertyItem
										key={index + "." + secindex}
										context={context.addRecordDataFrame(
											conditionOnGroup as wire.PlainWireRecord,
											secindex
										)}
										parentPath={conditionOnGroupPath}
										displayTemplate={getConditionTitle(
											conditionOnGroup
										)}
										itemProperties={(
											itemState: wire.PlainWireRecord
										) =>
											getProperties(
												conditionOnGroupPath,
												itemState
											)
										}
										itemPropertiesPanelTitle="Condition Properties"
									/>
								)
							}
						)
					)
				}}
			/>
		</>
	)
}

ConditionsProperties.displayName = "ConditionsProperties"

export default ConditionsProperties
