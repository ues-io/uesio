import { FC } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder, component } from "@uesio/ui"

const PropListsList = component.getUtility("uesio/builder.proplistslist")
const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

const PropListsSection: FC<SectionRendererProps> = (props) => {
	const { path = "", context, propsDef, valueAPI } = props
	// const uesio = hooks.useUesio(props)

	const section = props.section as builder.PropListsSection
	const itemsPath = path + `["${section.name}"]`
	const items = (valueAPI.get(itemsPath) as unknown[]) || []

	const defaultItemDef = section.defaultDefinition
		? section.defaultDefinition()
		: {}
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
						onClick={() =>
							valueAPI.add(itemsPath, defaultItemDef, -1)
						}
					/>
				}
			/>
			{section.properties && (
				<PropListsList
					items={items}
					context={context}
					path={itemsPath}
					propsDef={propsDef}
					valueAPI={valueAPI}
					descriptor={section}
					expandType={"popper"}
				/>
			)}
		</>
	)
}

export default PropListsSection
