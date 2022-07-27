import { FC, DragEvent, Fragment, ReactElement } from "react"
import { definition, component, hooks } from "@uesio/ui"

import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const Grid = component.getUtility("uesio/io.grid")
const Icon = component.getUtility("uesio/io.icon")

const order = [
	"avatar",
	"box",
	"code",
	"button",
	"grid",
	"group",
	"image",
	"tabs",
	"text",
	"titlebar",
	"deck",
	"list",
	"searchbox",
	"table",
	"tile",
	"barchart",
	"linechart",
]

const ComponentSeperator: FC<{ title: string; Icon: ReactElement }> = ({
	title,
	Icon,
}) => (
	<div
		style={{
			display: "flex",
			alignItems: "center",
			padding: "0 1em",
			lineHeight: 0,
			marginTop: "1.1em",
			marginBottom: "-0.5em",
		}}
	>
		{Icon}
		<p
			style={{
				fontWeight: 500,
				padding: "0 0.75em 0 0.5em",
			}}
		>
			{title}
		</p>
		{/* <div
			style={{
				flex: 1,
				width: "100%",
				height: "2px",
				backgroundColor: "#eee",
			}}
		/> */}
	</div>
)

const ComponentsPanel: FC<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const selectedItem = uesio.builder.useSelectedItem()
	const selectedType = uesio.builder.useSelectedType()
	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type) {
			const typeArray = target.dataset.type.split(":")
			const metadataType = typeArray.shift()
			const metadataItem = typeArray.join(":")
			if (metadataType && metadataItem) {
				uesio.builder.setDragNode(metadataType, metadataItem, "")
			}
		}
	}
	const onDragEnd = () => {
		uesio.builder.clearDragNode()
		uesio.builder.clearDropNode()
	}
	const builderComponents = component.registry.getBuilderComponents()

	const orderIOComponents = (components: any) =>
		components.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))

	const variants = uesio.component.useAllVariants()
	// loop over variants and group by component
	const variantsMap: Record<string, string[]> = {}
	variants.forEach((key) => {
		const [
			componentNamespace,
			componentName,
			variantNamespace,
			variantName,
		] = component.path.parseVariantKey(key)

		const componentKey = `${componentNamespace}.${componentName}`
		const variantKey = `${variantNamespace}.${variantName}`

		if (!variantsMap[componentKey]) variantsMap[componentKey] = []
		variantsMap[componentKey].push(variantKey)
	})

	return (
		<div
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			style={{
				overflow: "auto",
				flex: 1,
			}}
		>
			{Object.entries(builderComponents).map(
				([namespace, components], index) => {
					const orderedComponents =
						namespace === "io"
							? Object.entries(components)
							: orderIOComponents(Object.entries(components))

					return (
						<ExpandPanel
							title={namespace}
							defaultExpanded={true}
							key={index}
							context={context}
						>
							{orderedComponents.map(
								([componentName, propDef]) => {
									const fullName = `${namespace}.${componentName}`
									const isSelected =
										selectedType === "componenttype" &&
										selectedItem === fullName
									const sharedProps = {
										title: componentName,
										onClick: () =>
											uesio.builder.setSelectedNode(
												"componenttype",
												fullName,
												""
											),

										tooltip: propDef.description,
										context,
										selected: isSelected,
										expandChildren: true,
										draggable: `component:${fullName}`,
										icon: "drag_indicator",
									}
									const variants = variantsMap[fullName]

									// Loop over the variants for this component
									return (
										<Fragment key={fullName}>
											{componentName === "avatar" && (
												<ComponentSeperator
													Icon={
														<Icon
															context={context}
															icon={"grid_view"}
														/>
													}
													title="Regular"
												/>
											)}
											{componentName === "deck" && (
												<ComponentSeperator
													Icon={
														<Icon
															context={context}
															icon={"power"}
														/>
													}
													title="Data powered"
												/>
											)}
											{componentName === "barchart" && (
												<ComponentSeperator
													Icon={
														<Icon
															context={context}
															icon={"insights"}
														/>
													}
													title="Charts"
												/>
											)}
											<PropNodeTag {...sharedProps}>
												{variants && (
													<Grid
														styles={{
															root: {
																gridTemplateColumns:
																	"1fr",
																columnGap:
																	"8px",
																rowGap: "8px",
																padding: "8px",
															},
														}}
														context={context}
													>
														{variants.map(
															(variant) => {
																const variantFullName = `${fullName}:${variant}`
																const isVariantSelected =
																	selectedType ===
																		"componentvariant" &&
																	selectedItem ===
																		variantFullName
																return (
																	<PropNodeTag
																		title={
																			variant
																		}
																		key={
																			variant
																		}
																		onClick={(
																			e: MouseEvent
																		) => {
																			e.stopPropagation()
																			uesio.builder.setSelectedNode(
																				"componentvariant",
																				variantFullName,
																				""
																			)
																		}}
																		selected={
																			isVariantSelected
																		}
																		draggable={`componentvariant:${variantFullName}`}
																		context={
																			context
																		}
																	/>
																)
															}
														)}
													</Grid>
												)}
											</PropNodeTag>
										</Fragment>
									)
								}
							)}
						</ExpandPanel>
					)
				}
			)}
		</div>
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
