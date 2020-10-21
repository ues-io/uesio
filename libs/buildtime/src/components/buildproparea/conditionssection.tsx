import React, { ReactElement } from "react"
import { material, definition, wire, hooks, builder } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../toolbar/expandpanel/expandpanel"
import AddIcon from "@material-ui/icons/AddBox"
import ConditionsIcon from "@material-ui/icons/FilterList"
import PropNodeTag from "../buildpropitem/propnodetag"
import PropertiesPanel from "../toolbar/propertiespanel/propertiespanel"

function getConditionTitle(condition: wire.WireConditionDefinition): string {
	if (condition.valueSource === "VALUE" || !condition.valueSource) {
		const valueCondition = condition as wire.ValueConditionDefinition
		return `${valueCondition.field} = ${valueCondition.value}`
	}
	return ""
}

function getConditionProperties(
	condition: wire.WireConditionDefinition
): builder.PropDescriptor[] {
	if (condition.valueSource === "VALUE" || !condition.valueSource) {
		return [
			{
				name: "field",
				type: "METADATA",
				metadataType: "FIELD",
				label: "Field",
				groupingParents: 2,
				groupingProperty: "collection",
			},
			{
				name: "value",
				type: "TEXT",
				label: "Value",
			},
			{
				name: "valueSource",
				type: "SELECT",
				label: "Value Source",
				options: [
					{
						label: "Lookup",
						value: "LOOKUP",
					},
					{
						label: "Param",
						value: "PARAM",
					},
				],
			},
			{
				name: "id",
				type: "TEXT",
				label: "Id",
			},
		]
	}
	return []
}

function ConditionsSection(props: SectionRendererProps): ReactElement | null {
	const section = props.section
	const def = props.definition

	const uesio = hooks.useUesio(props)
	const theme = material.useTheme()
	const selectedNode = uesio.builder.useSelectedNode()
	const path = props.path

	const conditionsDef = def?.conditions as definition.Definition[] | undefined

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			action={AddIcon}
			actionColor={theme.palette.primary.main}
			actionOnClick={(): void => {
				uesio.view.addDefinition(path + '["conditions"]', {
					field: null,
					value: "NEW_VALUE",
				})
			}}
		>
			{conditionsDef?.map(
				(condition: wire.WireConditionDefinition, index) => {
					const conditionPath = path + `["conditions"]["${index}"]`
					const selected = selectedNode.startsWith(conditionPath)
					return (
						<PropNodeTag
							title={getConditionTitle(condition)}
							icon={ConditionsIcon}
							selected={selected}
							iconColor={theme.palette.primary.main}
							key={index}
							onClick={(): void => {
								uesio.builder.setSelectedNode(conditionPath)
							}}
						>
							<PropertiesPanel
								path={conditionPath}
								index={0}
								componentType={""}
								context={props.context}
								definition={condition}
								propDef={{
									title: "Condition",
									sections: [],
									defaultDefinition: () => ({}),
									properties: getConditionProperties(
										condition
									),
									actions: [
										{
											label: "Toggle Condition",
											type: "TOGGLE_CONDITION",
										},
									],
								}}
							></PropertiesPanel>
						</PropNodeTag>
					)
				}
			)}
		</ExpandPanel>
	)
}

export default ConditionsSection
