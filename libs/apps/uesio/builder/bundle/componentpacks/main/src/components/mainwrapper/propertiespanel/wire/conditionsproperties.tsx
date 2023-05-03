import { definition, component, wire } from "@uesio/ui"
import { add, get } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"
import { useSelectedPath } from "../../../../api/stateapi"

function getConditionPropertiesPanelTitle(
	condition: wire.WireConditionState
): string {
	return `${condition.type === "GROUP" ? "Group " : ""} Condition Properties`
}

function getConditionTitle(condition: wire.WireConditionState): string {
	if (condition.type === "GROUP" && !condition.valueSource) {
		return `GROUP ${condition.conjunction}`
	}

	if (condition.valueSource === "VALUE") {
		const valueCondition = condition as wire.ValueConditionState
		return `${valueCondition.field} ${valueCondition.operator || ""} ${
			valueCondition.value || ""
		}`
	}

	if (condition.valueSource === "PARAM") {
		const valueCondition = condition as wire.ParamConditionState
		return `${valueCondition.field} ${
			valueCondition.operator || ""
		} Param{${valueCondition.param}}`
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

	const items = get(context, conditionsPath) as wire.WireConditionState[]

	const getProperties = (parentPath: FullPath) => [
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
		},
		{
			name: "operator",
			type: "SELECT",
			label: "Operator",
			options: [
				{
					label: "",
					value: "",
				},
				{
					label: "Equals",
					value: "EQ",
				},
				{
					label: "Not Equal To",
					value: "NOT_EQ",
				},
				{
					label: "Greater Than",
					value: "GT",
				},
				{
					label: "Less Than",
					value: "LT",
				},
				{
					label: "Greater Than or Equal To",
					value: "GTE",
				},
				{
					label: "Less Than or Equal To",
					value: "LTE",
				},
				{
					label: "In",
					value: "IN",
				},
				{
					label: "Is Blank",
					value: "IS_BLANK",
				},
				{
					label: "Is Not Blank",
					value: "IS_NOT_BLANK",
				},
				{
					label: "Between",
					value: "BETWEEN",
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
					type: "fieldValue",
					operator: "IN",
					field: "operator",
					values: [
						"EQ",
						"NOT_EQ",
						"GT",
						"LT",
						"GTE",
						"LTE",
						"IN",
						"BETWEEN",
					],
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
			name: "value",
			type: "TEXT",
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
					value: "BETWEEN",
					operator: "NOT_EQUALS",
				},
			],
		},
		{
			name: "values",
			type: "LIST",
			label: "Values",
			items: {
				title: "Value",
				addLabel: "Add Value",
				// displayTemplate: (record: wire.PlainWireRecord) =>
				// 	getDisplayConditionLabel(
				// 		record as component.DisplayCondition
				// 	),
				// defaultDefinition: { operator: "EQUALS" },
				// properties: DisplayConditionProperties,
			},
			displayConditions: [
				{
					field: "valueSource",
					value: "VALUE",
					type: "fieldValue",
					operator: "EQUALS",
				},
			],
		},
		{
			name: "active",
			type: "CHECKBOX",
			label: "Active by default",
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

	const defaultConditionDef = { active: true }

	const defaultConditionGroupDef = {
		type: "GROUP",
		conjunction: "AND",
		conditions: [defaultConditionDef],
		active: true,
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
				itemProperties={getProperties(conditionsPath)}
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
										itemProperties={getProperties(
											conditionOnGroupPath
										)}
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
