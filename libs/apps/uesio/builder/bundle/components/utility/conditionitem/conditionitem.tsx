import { FunctionComponent } from "react"
import { component, context, builder, wire, hooks } from "@uesio/ui"

import PropertiesPane from "../../shared/propertiespane"
const PropNodeTag = component.getUtility("uesio/builder.propnodetag")

type Props = {
	conditionPath: string
	context: context.Context
	condition: wire.WireConditionState
	valueAPI: builder.ValueAPI
}

const Grid = component.getUtility("uesio/io.grid")

const defaultConditionDef = {
	field: null,
	operator: "",
}
const defaultConditionGroupDef = {
	type: "GROUP",
	conjunction: "AND",
	conditions: [defaultConditionDef],
}

const conditionItemActions: builder.ActionDescriptor[] = [
	{ type: "DELETE" },
	{ type: "MOVE" },
	{ type: "CLONE" },
	{
		label: "Toggle Condition",
		type: "TOGGLE_CONDITION",
	},
]

function getConditionTitle(condition: wire.WireConditionState): string {
	if (condition.type === "GROUP" && !condition.valueSource) {
		return `GROUP ${condition.conjunction}`
	}

	if (condition.valueSource === "VALUE" || !condition.valueSource) {
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

	return ""
}

const getConditionProperties = (
	context: context.Context,
	conditionState: wire.WireConditionState
): builder.PropDescriptor[] => {
	const wire = context.getWire()
	const collection = wire?.getCollection()
	const fieldId = "field" in conditionState ? conditionState.field : ""
	const selectOptions = collection?.getField(fieldId)?.getSelectOptions()
	const valueProperty: builder.PropDescriptor = selectOptions?.length
		? {
				name: "value",
				type: "MULTISELECT",
				label: "Values",
				options: selectOptions,
				display: [
					{
						property: "valueSource",
						value: "VALUE",
					},
				],
		  }
		: {
				name: "value",
				type: "TEXT",
				label: "Value",
				display: [
					{
						property: "valueSource",
						value: "VALUE",
					},
				],
		  }

	return [
		{
			name: "id",
			type: "TEXT",
			label: "Id",
		},
		{
			name: "field",
			type: "METADATA",
			metadataType: "FIELD",
			label: "Field",
			groupingPath: "../../collection",
			display: [
				{
					type: "NOT_EQUALS",
					property: "type",
					value: "GROUP",
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
					label: "Has Any",
					value: "HAS_ANY",
				},
				{
					label: "Has All",
					value: "HAS_ALL",
				},
			],
			display: [
				{
					type: "NOT_EQUALS",
					property: "type",
					value: "GROUP",
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
			display: [
				{
					type: "INCLUDES",
					property: "operator",
					values: ["EQ", "NOT_EQ", "GT", "LT", "GTE", "LTE", "IN"],
				},
			],
		},
		valueProperty,
		{
			//TO-DO This should be a dynamic metadatapicker
			name: "lookupWire",
			type: "TEXT",
			label: "Lookup Wire",
			display: [
				{
					property: "valueSource",
					value: "LOOKUP",
				},
			],
		},
		{
			//TO-DO This should be a dynamic metadatapicker
			name: "lookupField",
			type: "TEXT",
			label: "Lookup Field",
			display: [
				{
					property: "valueSource",
					value: "LOOKUP",
				},
			],
		},
		{
			name: "param",
			type: "TEXT",
			label: "Param",
			display: [
				{
					property: "valueSource",
					value: "PARAM",
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
			display: [
				{
					property: "type",
					value: "GROUP",
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
			display: [
				{
					property: "type",
					value: "GROUP",
				},
			],
		},
	]
}

const ConditionItem: FunctionComponent<Props> = (props) => {
	const { conditionPath, context, condition, valueAPI } = props
	const uesio = hooks.useUesio(props)

	const isGroup = condition.type === "GROUP"
	const groupConditions =
		isGroup && !condition.valueSource ? condition.conditions : null

	const onClick = (e: MouseEvent) => {
		e.stopPropagation()
		const viewDefId = uesio.getViewDefId()
		viewDefId &&
			uesio.builder.setSelectedNode("viewdef", viewDefId, conditionPath)
	}

	const [, , selectedNode] = uesio.builder.useSelectedNode()

	return (
		<PropNodeTag
			selected={selectedNode === conditionPath}
			onClick={onClick}
			context={context}
			popperChildren={
				<PropertiesPane
					path={conditionPath}
					index={0}
					context={context}
					propsDef={{
						title: "Condition",
						sections: [],
						defaultDefinition: () => ({}),
						properties: getConditionProperties(
							context,
							valueAPI.get(
								selectedNode
							) as wire.WireConditionState
						),
						actions: isGroup
							? [
									...conditionItemActions,
									{
										label: "Add Condition",
										type: "ADD_CONDITION",
										path: conditionPath,
										definition: defaultConditionDef,
										logo: "add",
									},
									{
										label: "Add Group",
										type: "ADD_CONDITION",
										path: conditionPath,
										definition: defaultConditionGroupDef,
										logo: "library_add",
									},
							  ]
							: [...conditionItemActions],
					}}
					valueAPI={valueAPI}
				/>
			}
		>
			{getConditionTitle(condition)}
			{!!groupConditions && (
				<Grid
					styles={{
						root: {
							gridTemplateColumns: "1fr",
							columnGap: "8px",
							rowGap: "8px",
							padding: "8px",
						},
					}}
					context={context}
				>
					{groupConditions.map(
						(conditionOnGroup: wire.WireConditionState, index) => {
							const conditionOnGroupPath = `${conditionPath}["conditions"]["${index}"]`

							return (
								<ConditionItem
									key={conditionOnGroupPath}
									conditionPath={conditionOnGroupPath}
									context={context}
									condition={conditionOnGroup}
									valueAPI={valueAPI}
								/>
							)
						}
					)}
				</Grid>
			)}
		</PropNodeTag>
	)
}

ConditionItem.displayName = "ConditionItem"

export default ConditionItem
