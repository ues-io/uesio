import { definition, component, wire, collection, context } from "@uesio/ui"
import { add, get } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"
import { useSelectedPath } from "../../../../api/stateapi"
import { getFieldMetadata } from "../../../../api/wireapi"
import {
	ComponentProperty,
	TextProperty,
	NumberProperty,
	CheckboxProperty,
	SelectProperty,
	DateProperty,
	TimestampProperty,
} from "../../../../properties/componentproperty"
import * as operators from "../../../shared/operatorproperties"

function getConditionPropertiesPanelTitle(
	condition: wire.WireConditionState
): string {
	return `${condition.type === "GROUP" ? "Group " : ""} Condition Properties`
}

const multiValueOperators = [
	operators.HASANY.value,
	operators.HASALL.value,
	operators.IN.value,
	operators.NOTIN.value,
]
const blankNotBlankOperators = [operators.BLANK.value, operators.NOTBLANK.value]

type BaseProperty = {
	name: string
	label?: string
	displayConditions?: component.DisplayCondition[]
}

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
	valueSource: wire.FieldValue
) {
	const options = [{ label: "", value: "" }]
	if (fieldDisplayType && valueSource) {
		switch (valueSource) {
			case "LOOKUP": {
				return options.concat(operators.INNOTIN)
			}
			case "PARAM": {
				switch (fieldDisplayType) {
					case "REFERENCE":
					case "USER":
					case "FILE":
					case "SELECT": {
						return options.concat(
							operators.EQNOTEQ,
							operators.INNOTIN
						)
					}
					case "NUMBER":
					case "TIMESTAMP":
					case "DATE": {
						return options.concat(
							operators.EQNOTEQ,
							operators.GTLT,
							operators.GTELTE,
							operators.INNOTIN
						)
					}
					case "AUTONUMBER":
					case "EMAIL":
					case "TEXT":
					case "LONGTEXT": {
						return options.concat(operators.EQNOTEQ, [
							operators.STARTWITH,
							operators.CONTAINS,
						])
					}
					case "MULTISELECT": {
						return options.concat(operators.HASANYHASALL)
					}
					default:
						return options.concat(operators.EQNOTEQ)
				}
			}
			case "VALUE": {
				switch (fieldDisplayType) {
					case "REFERENCE":
					case "USER":
					case "FILE":
					case "SELECT": {
						return options.concat(
							operators.EQNOTEQ,
							operators.INNOTIN,
							operators.BLANKNOTBLANK
						)
					}
					case "CHECKBOX": {
						return options.concat(
							operators.EQNOTEQ,
							operators.BLANKNOTBLANK
						)
					}
					case "NUMBER":
					case "TIMESTAMP":
					case "DATE": {
						return options.concat(
							operators.EQNOTEQ,
							operators.GTLT,
							operators.GTELTE,
							operators.INNOTIN,
							[operators.BETWEEN],
							operators.BLANKNOTBLANK
						)
					}
					case "AUTONUMBER":
					case "EMAIL":
					case "LONGTEXT":
					case "TEXT": {
						return options.concat(
							operators.EQNOTEQ,
							operators.INNOTIN,
							[operators.STARTWITH, operators.CONTAINS],
							operators.BLANKNOTBLANK
						)
					}
					case "MULTISELECT": {
						return options.concat(
							operators.HASANYHASALL,
							operators.BLANKNOTBLANK
						)
					}
					default:
						return options.concat(operators.EQNOTEQ)
				}
			}
		}
	}
	return []
}

function getDynamicProperty(
	baseProp: BaseProperty,
	fieldDisplayType: wire.FieldType | undefined,
	fieldMetadata: collection.Field | undefined,
	context: context.Context
):
	| TextProperty
	| NumberProperty
	| CheckboxProperty
	| SelectProperty
	| DateProperty
	| TimestampProperty {
	// TODO: Add additional property types here to support things like DATE

	if (fieldDisplayType === "CHECKBOX") {
		return { ...baseProp, type: "CHECKBOX" } as CheckboxProperty
	}

	if (fieldDisplayType === "NUMBER") {
		return { ...baseProp, type: "NUMBER" } as NumberProperty
	}

	if (fieldDisplayType === "DATE") {
		return { ...baseProp, type: "DATE" } as DateProperty
	}

	if (fieldDisplayType === "TIMESTAMP") {
		return { ...baseProp, type: "TIMESTAMP" } as TimestampProperty
	}

	if (fieldDisplayType === "SELECT") {
		return {
			...baseProp,
			type: "SELECT",
			options: fieldMetadata?.getSelectOptions(context),
		} as SelectProperty
	}

	return { ...baseProp, type: "TEXT" } as TextProperty
}

const getProperties = (
	wireName: string | undefined,
	parentPath: FullPath,
	itemState: wire.PlainWireRecord,
	viewPath: FullPath,
	context: context.Context
): ComponentProperty[] => {
	const fieldMetadata =
		itemState.field && wireName
			? getFieldMetadata(
					context,
					wireName as string,
					itemState.field as string
			  )
			: undefined

	const fieldDisplayType = fieldMetadata?.getType() || undefined
	const valueSource = itemState.valueSource

	const paramsPath =
		valueSource === "PARAM" ? viewPath.addLocal("params") : null
	const viewParams = paramsPath
		? (get(context, paramsPath) as wire.ParamConditionState)
		: {}

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
			groupingPath: `${"../".repeat(parentPath.size() - 3)}../collection`,
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
						"param",
						"params",
						"lookupWire",
						"lookupField",
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
				{
					// Clear out all of these wire condition properties valueSource field is changed
					updates: [
						"operator",
						"value",
						"values",
						"start",
						"end",
						"inclusiveStart",
						"inclusiveEnd",
						"param",
						"params",
						"lookupWire",
						"lookupField",
					].map((field) => ({ field })),
				},
			],
		},
		{
			name: "operator",
			type: "SELECT",
			label: "Operator",
			options: getOperatorOptions(fieldDisplayType, valueSource),
			displayConditions: [
				{
					operator: "NOT_EQUALS",
					field: "type",
					value: "GROUP",
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
							values: multiValueOperators.concat(
								blankNotBlankOperators
							),
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
			...getDynamicProperty(
				{
					name: "start",
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
				fieldDisplayType,
				fieldMetadata,
				context
			),
		},
		{
			...getDynamicProperty(
				{
					name: "end",
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
				fieldDisplayType,
				fieldMetadata,
				context
			),
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
			...getDynamicProperty(
				{
					name: "value",
					label: "Value",
					displayConditions: [
						{
							field: "valueSource",
							value: "VALUE",
							type: "fieldValue",
							operator: "EQUALS",
						},
						{
							type: "fieldValue",
							field: "operator",
							operator: "NOT_IN",
							values: multiValueOperators.concat([
								...blankNotBlankOperators,
								"BETWEEN",
							]),
						},
						{
							operator: "NOT_EQUALS",
							field: "operator",
							value: "",
							type: "fieldValue",
						},
					],
				},
				fieldDisplayType,
				fieldMetadata,
				context
			),
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
					field: "valueSource",
					value: "VALUE",
					type: "fieldValue",
					operator: "EQUALS",
				},
				{
					field: "operator",
					type: "fieldValue",
					operator: "IN",
					values: multiValueOperators,
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
				{
					operator: "NOT_EQUALS",
					field: "operator",
					value: "",
					type: "fieldValue",
				},
			],
			onChange: [
				{
					updates: [
						{
							field: "lookupField",
						},
					],
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
					field: "operator",
					value: "",
					type: "fieldValue",
				},
			],
		},
		{
			name: "params",
			type: "LIST",
			label: "Params",
			subtype: "SELECT",
			subtypeOptions: Object.keys(viewParams).map((param) => ({
				label: param,
				value: param,
			})),
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
			],
		},
		{
			name: "param",
			type: "SELECT",
			label: "Param",
			options: collection.addBlankSelectOption(
				Object.keys(viewParams).map((param) => ({
					label: param,
					value: param,
				}))
			),
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
					field: "operator",
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
		{
			name: "inactive",
			type: "CHECKBOX",
			label: "Inactive by default",
		},
	]
}

const ConditionsProperties: definition.UC = (props) => {
	const { context } = props
	const ListPropertyUtility = component.getUtility(
		"uesio/builder.listproperty"
	)
	const ListPropertyItem = component.getUtility(
		"uesio/builder.listpropertyitem"
	)

	const propertyName = "conditions"
	const selectedPath = useSelectedPath(context)
	const wirePath = selectedPath.trimToSize(2)
	const conditionsPath = wirePath.addLocal(propertyName)
	const [wireName] = wirePath.pop()

	const items = get(context, conditionsPath) as wire.WireConditionState[]
	const defaultConditionDef = {}
	const defaultConditionGroupDef = {
		type: "GROUP",
		conjunction: "AND",
		conditions: [defaultConditionDef],
	}
	const viewPath = selectedPath.trim()

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
					getProperties(
						wireName,
						conditionsPath,
						itemState,
						viewPath,
						context
					)
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
												wireName,
												conditionOnGroupPath,
												itemState,
												viewPath,
												context
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
