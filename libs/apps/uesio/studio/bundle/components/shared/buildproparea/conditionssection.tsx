import { FunctionComponent } from "react"
import { definition, wire, hooks, builder, component } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import PropNodeTag from "../buildpropitem/propnodetag"
import PropertiesPane from "../propertiespane"

const TitleBar = component.registry.getUtility("uesio/io.titlebar")
const Button = component.registry.getUtility("uesio/io.button")
const Icon = component.registry.getUtility("uesio/io.icon")

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
	const { path, context, valueAPI } = props
	const wireDef = valueAPI.get(path || "") as
		| definition.DefinitionMap
		| undefined
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const [, , selectedNode] = uesio.builder.useSelectedNode()
	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const conditionsDef = wireDef?.conditions as
		| definition.Definition[]
		| undefined

	const primaryColor = theme.definition.palette.primary

	const conditionsPath = `${path}["conditions"]`

	return (
		<>
			<TitleBar
				variant="studio.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="studio.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="studio.actionicon"
							/>
						}
						label="New Condition"
						onClick={() => {
							valueAPI.add(conditionsPath, {
								field: null,
								value: "NEW_VALUE",
							})
						}}
					/>
				}
			/>
			{conditionsDef?.map(
				(condition: wire.WireConditionDefinition, index) => {
					const conditionPath = `${conditionsPath}["${index}"]`
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
							popChildren
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
									valueAPI={valueAPI}
								/>
							}
						</PropNodeTag>
					)
				}
			)}
		</>
	)
}

export default ConditionsSection
