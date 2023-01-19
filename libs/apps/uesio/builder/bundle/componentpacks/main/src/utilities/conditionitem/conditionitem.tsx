import { FunctionComponent } from "react"
import { component, context, wire } from "@uesio/ui"
import BuildActionsArea from "../../helpers/buildactionsarea"
import PropertiesPane from "../../shared/propertiespane"

import PropNodeTag from "../propnodetag/propnodetag"
import { useSelectedPath } from "../../api/stateapi"

type Props = {
	conditionPath: string
	context: context.Context
	condition: wire.WireConditionState
}

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

const ConditionItem: FunctionComponent<Props> = (props) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const Grid = component.getUtility("uesio/io.grid")
	const { conditionPath, context, condition } = props

	const isGroup = condition.type === "GROUP"
	const groupConditions =
		isGroup && !condition.valueSource ? condition.conditions : null

	const onClick = (e: MouseEvent) => {
		e.stopPropagation()
		//const viewDefId = context.getViewDefId()
		//viewDefId &&
		//	api.builder.setSelectedNode("viewdef", viewDefId, conditionPath)
	}

	const selectedPath = useSelectedPath(context)
	const selected = selectedPath.localPath === conditionPath

	return (
		<PropNodeTag
			selected={selected}
			onClick={onClick}
			context={context}
			popperChildren={
				<PropertiesPane
					path={conditionPath}
					context={context}
					propsDef={{
						title: "Condition",
						sections: [],
						defaultDefinition: () => ({}),
						properties: [],
					}}
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
