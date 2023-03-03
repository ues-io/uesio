import { definition, component, wire } from "@uesio/ui"
import { add, get } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"
import { useSelectedPath } from "../../../../api/stateapi"

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
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
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
					values: ["EQ", "NOT_EQ", "GT", "LT", "GTE", "LTE", "IN"],
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

	const defaultConditionDef = {}

	const defaultConditionGroupDef = {
		type: "GROUP",
		conjunction: "AND",
		conditions: [defaultConditionDef],
	}

	return (
		<>
			<TitleBar
				variant="uesio/builder.propsubsection"
				title={""}
				context={context}
				actions={
					<>
						<Button
							context={context}
							variant="uesio/builder.actionbutton"
							icon={
								<Icon
									context={context}
									icon="add"
									variant="uesio/builder.actionicon"
								/>
							}
							label={"Add Group"}
							onClick={() => {
								add(
									context,
									conditionsPath.addLocal(
										`${items?.length || 0}`
									),
									defaultConditionGroupDef
								)
							}}
						/>
						<Button
							context={context}
							variant="uesio/builder.actionbutton"
							icon={
								<Icon
									context={context}
									icon="add"
									variant="uesio/builder.actionicon"
								/>
							}
							label={"Add Condition"}
							onClick={() => {
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
									targetPath =
										selectedPath.addLocal("conditions")
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
							}}
						/>
					</>
				}
			/>

			{items?.map((item: wire.WireConditionState, index) => {
				const isGroup = item.type === "GROUP"
				const groupConditions =
					isGroup && !item.valueSource ? item.conditions : null

				return (
					<ListPropertyItem
						key={index}
						context={context.addRecordDataFrame(
							item as wire.PlainWireRecord,
							index
						)}
						parentPath={conditionsPath}
						displayTemplate={getConditionTitle(item)}
						itemProperties={getProperties(conditionsPath)}
						itemPropertiesPanelTitle={
							isGroup ? "Group Condition" : "Condition"
						}
						children={
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
											itemPropertiesPanelTitle={
												"Condition"
											}
										/>
									)
								}
							)
						}
					/>
				)
			})}
		</>
	)
}

ConditionsProperties.displayName = "ConditionsProperties"

export default ConditionsProperties
