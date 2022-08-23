import { FunctionComponent, DragEvent } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"

import PropNodeTag from "./buildpropitem/propnodetag"
import groupBy from "lodash/groupBy"

const Grid = component.getUtility("uesio/io.grid")
const Text = component.getUtility("uesio/io.text")

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				overflow: "auto",
				flex: 1,
			},
			componentTitle: {
				verticalAlign: "middle",
				marginLeft: "4px",
			},
			componentDesc: {
				fontSize: "8pt",
				fontWeight: 300,
				lineHeight: "10pt",
				marginTop: "6px",
			},
			categoryLabel: {
				margin: "16px 10px 0 10px",
				fontSize: "8pt",
				fontWeight: "300",
			},
		},
		props
	)
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
	const categoryOrder = ["LAYOUT", "DATA", "VISUALIZATION", "UNCATEGORIZED"]

	// sort the variants by category
	const componentsByCategory = groupBy(
		builderComponents,
		(propDef) => propDef.category || "UNCATEGORIZED"
	)
	const namespaceInfoMap = uesio.builder.getNamespaceInfo()
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
			className={classes.root}
		>
			{categoryOrder.map((category) => {
				const comps = componentsByCategory[category]
				if (comps?.length) {
					return (
						<div>
							<div className={classes.categoryLabel}>
								{category}
							</div>
							{comps.map((propDef) => {
								const { namespace, name, title, description } =
									propDef
								if (!namespace)
									throw new Error(
										"Invalid Property Definition"
									)
								const fullName = `${namespace}.${name}`

								const variants = variantsMap[fullName]
								const namespaceInfo =
									namespaceInfoMap?.[namespace]
								if (!namespaceInfo)
									throw new Error("Invalid Namespace Info")

								// Loop over the variants for this component
								return (
									<PropNodeTag
										context={context}
										key={fullName}
										onClick={() =>
											uesio.builder.setSelectedNode(
												"componenttype",
												fullName,
												""
											)
										}
										draggable={`component:${fullName}`}
										selected={
											selectedType === "componenttype" &&
											selectedItem === fullName
										}
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
										<div>
											<div>
												<Text
													variant="uesio/io.icon"
													text={namespaceInfo.icon}
													color={namespaceInfo.color}
													context={context}
												/>
												<Text
													text={title}
													context={context}
													classes={{
														root: classes.componentTitle,
													}}
												/>
											</div>
											<Text
												element="div"
												text={description}
												context={context}
												classes={{
													root: classes.componentDesc,
												}}
											/>
										</div>
									</PropNodeTag>
								)
							})}
						</div>
					)
				}
				return null
			})}
		</div>
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
