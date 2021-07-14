import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import { getOnDragStartToolbar, getOnDragStopToolbar } from "./dragdrop"
import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const isStructureView = uesio.builder.useIsStructureView()
	const onDragStart = getOnDragStartToolbar(uesio)
	const onDragEnd = getOnDragStopToolbar(uesio)
	const builderComponents = component.registry.getBuilderComponents()

	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="io.primary"
					title={"Components"}
					context={context}
				/>
			}
			context={context}
		>
			<div
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				style={{
					overflow: "auto",
					flex: 1,
				}}
			>
				{Object.entries(builderComponents).map(
					([namespace, components], index) => (
						<ExpandPanel
							title={namespace}
							defaultExpanded={true}
							key={index}
							context={context}
						>
							{Object.entries(components).map(
								([componentName, propDef], indexTag) => (
									<PropNodeTag
										title={componentName}
										key={indexTag}
										tooltip={propDef.description}
										context={context}
										draggable={
											isStructureView
												? component.dragdrop.createComponentBankKey(
														namespace,
														componentName
												  )
												: undefined
										}
										onClick={() =>
											uesio.builder.setSelectedNode(
												`["componentvariants"]["${namespace}.${componentName}"]`
											)
										}
										icon={
											isStructureView
												? "drag_indicator"
												: undefined
										}
									/>
								)
							)}
						</ExpandPanel>
					)
				)}
			</div>
		</ScrollPanel>
	)
}

export default ComponentsPanel
