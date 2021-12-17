import { FC } from "react"
import { hooks, component } from "@uesio/ui"
import { SectionRendererProps } from "../sectionrendererdefinition"

import PropNodeTag from "../../buildpropitem/propnodetag"
import PropertiesPane from "../../propertiespane"
import conditionProperties from "./conditionProperties"
import Condition from "./conditiontypes"

const TitleBar = component.registry.getUtility("io.titlebar")
const Button = component.registry.getUtility("io.button")
const Icon = component.registry.getUtility("io.icon")

const ConditionalDisplaySection: FC<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props

	const uesio = hooks.useUesio(props)
	const displayPath = `${path}["uesio.display"]`

	const [, , selectedNode] = uesio.builder.useSelectedNode()
	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const conditions = (valueAPI.get(displayPath) as Condition[]) || []

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
							valueAPI.add(displayPath, {
								type: "null",
							})
						}}
					/>
				}
			/>
			{!!conditions.length &&
				conditions.map((c, index) => {
					const conditionPath = `${displayPath}["${index}"]`
					const selected = selectedNode.startsWith(conditionPath)

					return (
						<PropNodeTag
							title={Object.values(c)
								.filter((el) => el)
								.join(" | ")}
							icon={"filter_list"}
							selected={selected}
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
							<PropertiesPane
								path={conditionPath}
								context={context}
								propsDef={{
									title: "Condition",
									sections: [],
									defaultDefinition: () => ({}),
									properties: conditionProperties,
								}}
								valueAPI={valueAPI}
							/>
						</PropNodeTag>
					)
				})}
		</>
	)
}

export default ConditionalDisplaySection
