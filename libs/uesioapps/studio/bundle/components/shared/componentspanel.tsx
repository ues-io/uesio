import { FunctionComponent, DragEvent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const Grid = component.registry.getUtility("io.grid")

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, className } = props
	const isStructureView = uesio.builder.useIsStructureView()
	const selectedItem = uesio.builder.useSelectedItem()
	const selectedType = uesio.builder.useSelectedType()
	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type && isStructureView) {
			const typeArray = target.dataset.type.split(".")
			const metadataType =
				typeArray.length === 4 ? "componentvariant" : "component"
			uesio.builder.setDragNode(metadataType, target.dataset.type, "")
		}
	}
	const onDragEnd = () => {
		uesio.builder.clearDragNode()
		uesio.builder.clearDropNode()
	}
	const builderComponents = component.registry.getBuilderComponents()
	const variants = uesio.component.useAllVariants()
	// loop over variants and group by component
	const variantsMap: Record<string, component.ComponentVariant[]> = {}
	Object.keys(variants).forEach((key) => {
		const [
			componentNamespace,
			componentName,
			variantNamespace,
			variantName,
		] = component.path.parseVariantKey(key)
		const componentKey = `${componentNamespace}.${componentName}`
		if (!variantsMap[componentKey]) variantsMap[componentKey] = []
		const variant = variants[key]
		if (variant) {
			variantsMap[componentKey].push(variant)
		}
	})

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
							styles={{
								innerContent: {
									display: "grid",
									rowGap: "8px",
								},
							}}
						>
							{Object.entries(components).map(
								([componentName, propDef]) => {
									const fullName = `${namespace}.${componentName}`
									const isSelected =
										selectedType === "componenttype" &&
										selectedItem === fullName
									const sharedProps = {
										title: componentName,
										// onClick: () =>
										// 	uesio.builder.setSelectedNode(
										// 		"componenttype",
										// 		fullName,
										// 		""
										// 	),
										key: fullName,
										tooltip: propDef.description,
										context,
										selected: isSelected,
										expandChildren: true,
										...(isStructureView && {
											draggable: fullName,
											icon: "drag_indicator",
										}),
									}
									const variants = variantsMap[fullName]

									// Loop over the variants for this component
									return (
										<PropNodeTag {...sharedProps}>
											{variants && (
												<Grid
													styles={{
														root: {
															gridTemplateColumns:
																"1fr 1fr",
															columnGap: "8px",
															rowGap: "8px",
															padding: "8px",
														},
													}}
													context={context}
												>
													{variants.map((variant) => {
														const variantFullName = `${variant.namespace}.${variant.name}`
														return (
															<PropNodeTag
																title={
																	variantFullName
																}
																draggable={`${fullName}.${variantFullName}`}
																onClick={() =>
																	uesio.builder.setSelectedNode(
																		"componentvariant",
																		`${fullName}.${variantFullName}`,
																		""
																	)
																}
																context={
																	context
																}
															/>
														)
													})}
												</Grid>
											)}
										</PropNodeTag>
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
