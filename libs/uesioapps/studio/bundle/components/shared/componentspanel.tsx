import { FunctionComponent, DragEvent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, className } = props
	const isStructureView = uesio.builder.useIsStructureView()
	const selectedItem = uesio.builder.useSelectedItem()
	const selectedType = uesio.builder.useSelectedType()
	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type && isStructureView) {
			uesio.builder.setDragNode("component", target.dataset.type, "")
		}
	}
	const onDragEnd = () => {
		uesio.builder.clearDragNode()
		uesio.builder.clearDropNode()
	}
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
			className={className}
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
								([componentName, propDef], indexTag) => {
									const fullName = `${namespace}.${componentName}`
									const isSelected =
										selectedType === "componenttype" &&
										selectedItem === fullName
									const sharedProps = {
										draggable: fullName,
										title: componentName,
										onClick: () =>
											uesio.builder.setSelectedNode(
												"componenttype",
												fullName,
												""
											),
										key: indexTag,
										tooltip: propDef.description,
										context,
										selected: isSelected,
									}
									// Loop over the variants for this component

									return !isStructureView ? (
										<PropNodeTag {...sharedProps} />
									) : (
										<PropNodeTag
											{...sharedProps}
											draggable={fullName}
											icon="drag_indicator"
										/>
									)
								}
							)}
						</ExpandPanel>
					)
				)}
			</div>
		</ScrollPanel>
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
