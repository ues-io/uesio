import { FunctionComponent, DragEvent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import PropNodeTag from "./buildpropitem/propnodetag"

const Grid = component.getUtility("uesio/io.grid")

function getIconFromCategory(category: string | undefined) {
	switch (category) {
		case "LAYOUT":
			return "switch_video"
		case "DATA":
			return "thumb_up_off_alt"
		case "MIXED":
			return "traffic"
		case "VISUALIZATION":
			return "pest_control_rodent"
		default:
			return "power"
	}
}

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
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
	const builderComponents =
		component.registry.getBuilderComponentsSortedByCategory()
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
			{Object.entries(builderComponents).map(([category, components]) => (
				<>
					{Object.entries(components).map(
						([componentName, propDef]) => {
							const namespace = propDef.namespace
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
								draggable: `component:${fullName}`,
								icon: getIconFromCategory(category),
							}
							const variants = variantsMap[fullName]

							// Loop over the variants for this component
							return (
								<PropNodeTag
									key={fullName}
									{...sharedProps}
									panelChildren={
										variants && (
											<Grid
												styles={{
													root: {
														gridTemplateColumns:
															"1fr",
														columnGap: "8px",
														rowGap: "8px",
														padding: "8px",
													},
												}}
												context={context}
											>
												{variants.map((variant) => {
													const variantFullName = `${fullName}:${variant}`
													const isVariantSelected =
														selectedType ===
															"componentvariant" &&
														selectedItem ===
															variantFullName
													return (
														<PropNodeTag
															title={variant}
															key={variant}
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
															context={context}
														/>
													)
												})}
											</Grid>
										)
									}
								/>
							)
						}
					)}
				</>
			))}
		</div>
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
