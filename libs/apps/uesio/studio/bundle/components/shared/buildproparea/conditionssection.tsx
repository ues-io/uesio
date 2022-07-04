import { FunctionComponent } from "react"
import { definition, wire, hooks, component, builder } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ConditionItem from "../buildpropitem/conditionItem"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const defaultConditionDef = {
	field: null,
	valueSource: "VALUE",
	value: "NEW_VALUE",
}
const defaultConditionGroupDef = {
	type: "GROUP",
	conjunction: "AND",
	conditions: [
		{
			field: null,
			valueSource: "VALUE",
			value: "NEW_VALUE",
		},
	],
}

const getConditionProperties = (): builder.PropDescriptor[] => [
	{
		name: "field",
		type: "METADATA",
		metadataType: "FIELD",
		label: "Field",
		groupingParents: 2,
		groupingProperty: "collection",
	},
	{
		name: "operator",
		type: "SELECT",
		label: "Operator",
		options: [
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
		display: [
			{
				property: "operator",
				type: "INCLUDES",
				values: ["EQ", "NOT_EQ", "GT", "LT", "GTE", "LTE", "IN"],
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
				value: "VALUE",
			},
		],
	},
	{
		name: "lookupWire",
		type: "WIRE",
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
]

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
					<>
						<Button
							context={context}
							variant="uesio/studio.actionbutton"
							icon={
								<Icon
									context={context}
									icon="library_add"
									variant="uesio/studio.actionicon"
								/>
							}
							label="Add Group"
							onClick={() => {
								valueAPI.add(
									conditionsPath,
									defaultConditionGroupDef
								)
							}}
						/>
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
							label="Add Condition"
							onClick={() => {
								valueAPI.add(
									conditionsPath,
									defaultConditionDef
								)
							}}
						/>
					</>
				}
			/>
			{conditionsDef?.map(
				(condition: wire.WireConditionDefinition, index) => {
					const conditionPath = `${conditionsPath}["${index}"]`
					const selected = selectedNode === conditionPath

					return (
						<ConditionItem
							key={conditionPath}
							conditionPath={conditionPath}
							selected={selected}
							index={index}
							selectedNode={selectedNode}
							primaryColor={primaryColor}
							viewDefId={viewDefId}
							context={context}
							condition={condition}
							valueAPI={valueAPI}
							onClick={() => {
								uesio.builder.setSelectedNode(
									"viewdef",
									viewDefId,
									conditionPath
								)
							}}
						/>
					)
				}
			)}
		</>
	)
}

export default ConditionsSection
