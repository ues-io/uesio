import { FunctionComponent } from "react"
import { definition, wire, hooks, component } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ConditionItem from "../buildpropitem/conditionItem"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const defaultConditionDef = {
	field: null,
	operator: "",
}
const defaultConditionGroupDef = {
	type: "GROUP",
	conjunction: "AND",
	conditions: [defaultConditionDef],
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
