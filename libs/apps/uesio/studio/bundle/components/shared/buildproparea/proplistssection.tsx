import { FC } from "react"
import PropList from "./proplist"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder, component, hooks } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

const PropListsSection: FC<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	const section = props.section as builder.PropListsSection
	const itemsPath = path + `["${section.name}"]`
	const items = valueAPI.get(itemsPath) as unknown[]

	const defaultItemDef = Object.fromEntries(
		section.properties.map((el) => [el.name, null])
	)
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
						label="Add"
						onClick={() => valueAPI.add(itemsPath, defaultItemDef)}
					/>
				}
			/>
			{section.properties &&
				items?.map((item, index) => {
					const itemPath = itemsPath + `["${index}"]`
					return (
						<PropNodeTag
							key={index}
							context={context}
							onClick={() =>
								uesio.builder.setSelectedNode(
									metadataType,
									metadataItem,
									itemPath
								)
							}
							selected={selectedPath === itemPath}
						>
							<PropList
								path={itemPath}
								propsDef={propsDef}
								properties={section.properties}
								context={context}
								valueAPI={valueAPI}
							/>
						</PropNodeTag>
					)
				})}
		</>
	)
}

export default PropListsSection
