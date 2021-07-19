import { FunctionComponent } from "react"
import { definition, wire, hooks, builder } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import PropNodeTag from "../buildpropitem/propnodetag"
import PropertiesPane from "../propertiespane"

function getConditionTitle(condition: wire.WireConditionDefinition): string {
	if (condition.valueSource === "VALUE" || !condition.valueSource) {
		const valueCondition = condition as wire.ValueConditionDefinition
		return `${valueCondition.field} = ${valueCondition.value}`
	}
	return ""
}

const getConditionProperties = (
	condition: wire.WireConditionDefinition
): builder.PropDescriptor[] =>
	condition.valueSource === "VALUE" || !condition.valueSource
		? [
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
		: []

const ConditionsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, getValue, setValue } = props
	const wireDef = getValue(path || "") as definition.DefinitionMap | undefined
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const [metadataType, metadataItem, selectedNode] =
		uesio.builder.useSelectedNode()
	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const conditionsDef = wireDef?.conditions as
		| definition.Definition[]
		| undefined

	const primaryColor = theme.definition.palette.primary
	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			action="add_box"
			actionColor={primaryColor}
			actionOnClick={(): void => {
				uesio.view.addDefinition(path + '["conditions"]', {
					field: null,
					value: "NEW_VALUE",
				})
			}}
			context={context}
		>
			{conditionsDef?.map(
				(condition: wire.WireConditionDefinition, index) => {
					const conditionPath = `${path}["conditions"]["${index}"]`
					const selected = selectedNode.startsWith(conditionPath)
					return (
						<PropNodeTag
							title={getConditionTitle(condition)}
							icon={"filter_list"}
							selected={selected}
							iconColor={primaryColor}
							key={index}
							onClick={() => {
								uesio.builder.setSelectedNode(
									"viewdef",
									viewDefId,
									conditionPath
								)
							}}
							context={context}
						>
							{
								<PropertiesPane
									path={conditionPath}
									index={0}
									context={context}
									propsDef={{
										title: "Condition",
										sections: [],
										defaultDefinition: () => ({}),
										properties:
											getConditionProperties(condition),
										actions: [
											{
												label: "Toggle Condition",
												type: "TOGGLE_CONDITION",
											},
										],
									}}
									getValue={getValue}
									setValue={setValue}
								/>
							}
						</PropNodeTag>
					)
				}
			)}
		</ExpandPanel>
	)
}

export default ConditionsSection
