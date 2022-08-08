import React, { FunctionComponent, DragEvent, useEffect, useState } from "react"
import { definition, component, hooks } from "@uesio/ui"

import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetagnew"

const Grid = component.getUtility("uesio/io.grid")

const useExpand = (
	initialExpanded?: boolean,
	onExpand?: () => void,
	onClose?: () => void
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
	const [isExpanded, setIsExpanded] = useState(!!initialExpanded)

	useEffect(() => {
		if (isExpanded) onExpand && onExpand()
		if (isExpanded) onClose && onClose()
	}, [isExpanded])

	return [isExpanded, setIsExpanded]
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
	const builderComponents = component.registry.getBuilderComponents()
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
				([namespace, components], index) => (
					<ExpandPanel
						title={namespace}
						defaultExpanded={true}
						key={index}
						context={context}
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
									draggable: `component:${fullName}`,
									icon: "drag_indicator",
								}
								const variants = variantsMap[fullName]

								// Loop over the variants for this component
								return (
									<PropNodeTag
										useExpand={() => useExpand(isSelected)}
										key={fullName}
										{...sharedProps}
										expandChildren={
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
																context={
																	context
																}
															>
																{variant}
															</PropNodeTag>
														)
													})}
												</Grid>
											)
										}
									>
										{componentName}
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
