import { FunctionComponent, DragEvent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const Grid = component.registry.getUtility("io.grid")

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, className } = props
	const selectedItem = uesio.builder.useSelectedItem()
	const selectedType = uesio.builder.useSelectedType()
	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type) {
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
		const [componentNamespace, componentName] =
			component.path.parseVariantKey(key)
		const componentKey = `${componentNamespace}.${componentName}`
		if (!variantsMap[componentKey]) variantsMap[componentKey] = []
		const variant = variants[key]
		if (variant) {
			variantsMap[componentKey].push(variant)
		}
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
									draggable: fullName,
									icon: "drag_indicator",
								}
								const variants = variantsMap[fullName]

								// Loop over the variants for this component
								return (
									<PropNodeTag
										key={fullName}
										{...sharedProps}
									>
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
													const variantName = `${variant.namespace}.${variant.name}`
													const variantFullName = `${variant.component}.${variantName}`
													const isVariantSelected =
														selectedType ===
															"componentvariant" &&
														selectedItem ===
															variantFullName
													return (
														<PropNodeTag
															title={variantName}
															key={variantName}
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
															draggable={
																variantFullName
															}
															context={context}
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
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
