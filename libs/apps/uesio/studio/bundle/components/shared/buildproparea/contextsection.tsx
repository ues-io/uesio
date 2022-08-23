import { FC } from "react"
import { hooks, component, context as ctx } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"

import PropNodeTag from "../buildpropitem/propnodetag"
import PropertiesPane from "../propertiespane"
import conditionProperties from "./displayconditions/conditionProperties"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

function getFirstWireProp(path: string, context: ctx.Context): string {
	//TO-DO maybe this can look on the context fram of each component
	// and then do context.getRecord() to see if that component has a record on context
	const [parentDef, ancestorsPath] = context.getParentComponentDef(path)
	const wire = parentDef?.wire

	if (!parentDef || wire) {
		return wire || ""
	}

	return getFirstWireProp(ancestorsPath, context)
}

const ContextSection: FC<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props

	if (!path) return null

	const parentWire = getFirstWireProp(path, context)

	const uesio = hooks.useUesio(props)
	const displayPath = `${path}["uesio.filter"]`

	const [, , selectedNode] = uesio.builder.useSelectedNode()
	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const conditions =
		(valueAPI.get(displayPath) as component.DisplayCondition[]) || []

	return (
		<>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={parentWire || "no context found"}
				context={context}
				actions={
					parentWire !== "" && (
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
							label="New Ctx. Condition"
							onClick={() => {
								valueAPI.add(displayPath, {
									type: "null",
								})
							}}
						/>
					)
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

export default ContextSection
