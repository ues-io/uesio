import { FC } from "react"
import { hooks, component } from "@uesio/ui"
import { SectionRendererProps } from "../sectionrendererdefinition"

import PropertiesPane from "../../propertiespane"
import conditionProperties from "./conditionProperties"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const PropNodeTag = component.getUtility("uesio/builder.propnodetag")

const ConditionalDisplaySection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props

	const uesio = hooks.useUesio(props)
	const displayPath = `${path}["uesio.display"]`

	const [, , selectedNode] = uesio.builder.useSelectedNode()
	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const conditions =
		(valueAPI.get(displayPath) as component.DisplayCondition[]) || []

	return (
		<>
			<TitleBar
				variant="uesio/builder.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="uesio/builder.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/builder.actionicon"
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
							selected={selected}
							key={index}
							onClick={() => {
								uesio.builder.setSelectedNode(
									"viewdef",
									viewDefId,
									conditionPath
								)
							}}
							popperChildren={
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
							}
							context={context}
						>
							<span>
								{Object.values(c)
									.filter((el) => el)
									.join(" | ")}
							</span>
						</PropNodeTag>
					)
				})}
		</>
	)
}

export default ConditionalDisplaySection
