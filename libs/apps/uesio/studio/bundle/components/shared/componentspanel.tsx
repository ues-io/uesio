import { FC, DragEvent } from "react"
import {
	definition,
	component,
	hooks,
	styles,
	builder,
	metadata,
} from "@uesio/ui"

import PropNodeTag from "./buildpropitem/propnodetag"
import groupBy from "lodash/groupBy"

const Text = component.getUtility("uesio/io.text")

type VariantTagProps = {
	namespaceInfo: metadata.MetadataInfo
	variantInfo: component.ComponentVariant
} & definition.UtilityProps

const VariantTag: FC<VariantTagProps> = (props) => {
	const { context, namespaceInfo, variantInfo } = props
	const classes = styles.useUtilityStyles(
		{
			title: {
				verticalAlign: "middle",
				marginLeft: "4px",
			},
		},
		props
	)
	return (
		<div>
			<Text
				variant="uesio/io.icon"
				text={namespaceInfo.icon}
				color={namespaceInfo.color}
				context={context}
			/>
			<Text
				text={variantInfo.name}
				context={context}
				classes={{
					root: classes.title,
				}}
			/>
		</div>
	)
}

type VariantsBlockProps = {
	variants: component.ComponentVariant[]
	namespaceInfo: Record<string, metadata.MetadataInfo>
	selectedItem: metadata.MetadataKey
	selectedType: string
} & definition.UtilityProps

const VariantsBlock: FC<VariantsBlockProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, variants, selectedItem, namespaceInfo } = props

	const classes = styles.useUtilityStyles(
		{
			root: {
				marginTop: "8px",
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			{variants.map((variant) => {
				const variantKey = uesio.component.getVariantId(variant)
				const isVariantSelected = selectedItem === variantKey
				const variantNsInfo = namespaceInfo[variant.namespace]
				if (!variantNsInfo) return null
				return (
					<PropNodeTag
						key={variantKey}
						onClick={(e: MouseEvent) => {
							e.stopPropagation()
							uesio.builder.setSelectedNode(
								"componentvariant",
								variantKey,
								""
							)
						}}
						selected={isVariantSelected}
						draggable={`componentvariant:${variantKey}`}
						context={context}
						variant="uesio/studio.smallpropnodetag"
					>
						<VariantTag
							context={context}
							namespaceInfo={variantNsInfo}
							variantInfo={variant}
						/>
					</PropNodeTag>
				)
			})}
		</div>
	)
}

type ComponentBlockProps = {
	propDef: builder.BuildPropertiesDefinition
	variants: component.ComponentVariant[]
	namespaceInfo: Record<string, metadata.MetadataInfo>
	selectedItem: metadata.MetadataKey
	selectedType: string
} & definition.UtilityProps

const ComponentBlock: FC<ComponentBlockProps> = (props) => {
	const uesio = hooks.useUesio(props)

	const {
		context,
		propDef,
		namespaceInfo,
		variants,
		selectedType,
		selectedItem,
	} = props
	const { namespace, name } = propDef
	if (!namespace) throw new Error("Invalid Property Definition")
	const fullName = `${namespace}.${name}`

	// Filter out variants that aren't in one of our namespaces
	// (this is for filtering out variants from the studio namespace)
	const validVariants = variants
		? variants.filter((variant) => !!namespaceInfo[variant.namespace])
		: []

	// Loop over the variants for this component
	return (
		<PropNodeTag
			context={context}
			key={fullName}
			onClick={() =>
				uesio.builder.setSelectedNode("componenttype", fullName, "")
			}
			draggable={`component:${fullName}`}
			selected={
				selectedType === "componenttype" && selectedItem === fullName
			}
			expandChildren={
				validVariants &&
				validVariants.length && (
					<VariantsBlock
						namespaceInfo={namespaceInfo}
						selectedItem={selectedItem}
						selectedType={selectedType}
						variants={validVariants}
						context={context}
					/>
				)
			}
		>
			<ComponentTag
				namespaceInfo={namespaceInfo[namespace]}
				propDef={propDef}
				context={context}
			/>
		</PropNodeTag>
	)
}

type CategoryBlockProps = {
	propDefs: builder.BuildPropertiesDefinition[]
	variants: Record<string, component.ComponentVariant[]>
	namespaceInfo: Record<string, metadata.MetadataInfo>
	selectedItem: metadata.MetadataKey
	selectedType: string
	category: string
} & definition.UtilityProps

const CategoryBlock: FC<CategoryBlockProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			categoryLabel: {
				margin: "16px 10px 0 10px",
				fontSize: "8pt",
				fontWeight: "300",
			},
		},
		props
	)
	const {
		context,
		propDefs,
		category,
		variants,
		namespaceInfo,
		selectedType,
		selectedItem,
	} = props
	const comps = propDefs
	if (!comps || !comps.length) return null
	comps.sort((a, b) => {
		if (!a.name) return 1
		if (!b.name) return -1
		return a.name.localeCompare(b.name)
	})
	return (
		<>
			<div className={classes.categoryLabel}>{category}</div>
			{comps.map((propDef) => {
				const { namespace, name } = propDef
				if (!namespace) throw new Error("Invalid Property Definition")
				const fullName = `${namespace}.${name}`
				return (
					<ComponentBlock
						key={fullName}
						variants={variants[fullName]}
						propDef={propDef}
						context={context}
						namespaceInfo={namespaceInfo}
						selectedType={selectedType}
						selectedItem={selectedItem}
					/>
				)
			})}
		</>
	)
}

type ComponentTagProps = {
	namespaceInfo: metadata.MetadataInfo
	propDef: builder.BuildPropertiesDefinition
} & definition.UtilityProps

const ComponentTag: FC<ComponentTagProps> = (props) => {
	const { context, namespaceInfo, propDef } = props
	const classes = styles.useUtilityStyles(
		{
			title: {
				verticalAlign: "middle",
				marginLeft: "6px",
			},
			desc: {
				fontSize: "8pt",
				fontWeight: 300,
				lineHeight: "10pt",
				marginTop: "8px",
			},
		},
		props
	)
	return (
		<div>
			<div>
				<Text
					variant="uesio/io.icon"
					text={namespaceInfo.icon}
					color={namespaceInfo.color}
					context={context}
				/>
				<Text
					text={propDef.title}
					context={context}
					classes={{
						root: classes.title,
					}}
				/>
			</div>
			<Text
				element="div"
				text={propDef.description}
				context={context}
				classes={{
					root: classes.desc,
				}}
			/>
		</div>
	)
}

const ComponentsPanel: FC<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				overflow: "auto",
				flex: 1,
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
	const categoryOrder = [
		"LAYOUT",
		"CONTENT",
		"DATA",
		"INTERACTION",
		"VISUALIZATION",
		"UNCATEGORIZED",
	]

	// sort the variants by category
	const componentsByCategory = groupBy(
		builderComponents,
		(propDef) => propDef.category || "UNCATEGORIZED"
	)
	const namespaceInfo = uesio.builder.getNamespaceInfo()
	const variants = uesio.component.useAllVariants()
	const variantsByComponent = groupBy(
		variants,
		(variant) => variant.component
	)

	return (
		<div
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			className={classes.root}
		>
			{categoryOrder.map((category) => (
				<CategoryBlock
					key={category}
					namespaceInfo={namespaceInfo}
					variants={variantsByComponent}
					propDefs={componentsByCategory[category]}
					category={category}
					selectedType={selectedType}
					selectedItem={selectedItem}
					context={context}
				/>
			))}
		</div>
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
