import { FunctionComponent } from "react"
import { definition, wire, hooks, builder, component } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import PropNodeTag from "../buildpropitem/propnodetag"
import PropertiesPane from "../propertiespane"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

function getConditionTitle(condition: wire.WireConditionDefinition): string {
	if (condition.valueSource === "VALUE") {
		const valueCondition = condition as wire.ValueConditionDefinition
		return `${valueCondition.field} = ${valueCondition.value}`
	}

	if (condition.valueSource === "PARAM") {
		const valueCondition = condition as wire.ParamConditionDefinition
		return `${valueCondition.field} = Param{${valueCondition.param}}`
	}

	if (condition.valueSource === "LOOKUP") {
		const valueCondition = condition as wire.LookupConditionDefinition
		return `${valueCondition.field} = Lookup{${valueCondition.lookupWire}.${valueCondition.lookupField}}`
	}

	return "NEW CONDITION"
}

const getConditionProperties = (
	condition: wire.WireConditionDefinition
): builder.PropDescriptor[] => {
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
			name: "valueSource",
			type: "SELECT",
			label: "Value Source",
			options: [
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
		},
		{
			name: "value",
			type: "TEXT",
			label: "Value",
			display: [
				{
					property: "valueSource",
					values: ["VALUE"],
				},
			],
		},
		{
			//TO-DO This should be a dynamic metadatapicker
			name: "lookupWire",
			type: "TEXT",
			label: "Lookup Wire",
			display: [
				{
					property: "valueSource",
					values: ["LOOKUP"],
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
					values: ["LOOKUP"],
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
					values: ["PARAM"],
				},
			],
		},
	]
}

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
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="uesio/studio.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/studio.actionicon"
							/>
						}
						label="New Condition"
						onClick={() => {
							valueAPI.add(conditionsPath, {
								field: null,
								valueSource: "VALUE",
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
