import { FunctionComponent } from "react"
import { component, context, builder, wire, api } from "@uesio/ui"
import BuildActionsArea from "../../helpers/buildactionsarea"
import PropertiesPane from "../../shared/propertiespane"
import {
	getBaseProps,
	getOperatorProp,
	getValueProp,
	valueSourceProps,
} from "./conditionitemprops"
const PropNodeTag = component.getUtility("uesio/builder.propnodetag")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

type Props = {
	conditionPath: string
	context: context.Context
	condition: wire.WireConditionState
	valueAPI: builder.ValueAPI
}

const Grid = component.getUtility("uesio/io.grid")

// const defaultConditionDef = {
// 	field: null,
// 	operator: "",
// }
// const defaultConditionGroupDef = {
// 	type: "GROUP",
// 	conjunction: "AND",
// 	conditions: [defaultConditionDef],
// }

// const conditionItemActions: builder.ActionDescriptor[] = [
// 	{ type: "DELETE" },
// 	{ type: "MOVE" },
// 	// TO-DO
// 	// {
// 	// 	label: "Toggle Condition",
// 	// 	type: "TOGGLE_CONDITION",
// 	// },
// ]

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
	const fieldId =
		conditionState && "field" in conditionState ? conditionState.field : ""
	const field = collection?.getField(fieldId)
	const collectionName = collection?.getFullName() || ""

	return [
		...getBaseProps(collectionName),
		getOperatorProp(field),
		getValueProp(field),
		...valueSourceProps,
	]
}

const ConditionItem: FunctionComponent<Props> = (props) => {
	const { conditionPath, context, condition, valueAPI } = props

	const isGroup = condition.type === "GROUP"
	const groupConditions =
		isGroup && !condition.valueSource ? condition.conditions : null

	const onClick = (e: MouseEvent) => {
		e.stopPropagation()
		const viewDefId = context.getViewDefId()
		viewDefId &&
			api.builder.setSelectedNode("viewdef", viewDefId, conditionPath)
	}

	const [, , selectedNode] = api.builder.useSelectedNode()
	const selected = selectedNode === conditionPath

	return (
		<PropNodeTag
			selected={selected}
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
					}}
					valueAPI={valueAPI}
				/>
			}
		>
			<div className="tagroot">{getConditionTitle(condition)}</div>
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

			<IOExpandPanel context={context} expanded={selected}>
				<BuildActionsArea
					context={context}
					// path={conditionPath}
					// valueAPI={valueAPI}
					// actions={
					// 	isGroup
					// 		? [
					// 				...conditionItemActions,
					// 				{
					// 					label: "Add Condition",
					// 					type: "ADD_CONDITION",
					// 					path: conditionPath,
					// 					definition: defaultConditionDef,
					// 					logo: "add",
					// 				},
					// 				{
					// 					label: "Add Group",
					// 					type: "ADD_CONDITION",
					// 					path: conditionPath,
					// 					definition: defaultConditionGroupDef,
					// 					logo: "library_add",
					// 				},
					// 		  ]
					// 		: [...conditionItemActions]
					// }
				/>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

ConditionItem.displayName = "ConditionItem"

export default ConditionItem
