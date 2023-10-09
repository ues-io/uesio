import { DragEvent, useState } from "react"
import {
	definition,
	component,
	api,
	styles,
	metadata,
	context,
} from "@uesio/ui"

import groupBy from "lodash/groupBy"
import pickBy from "lodash/pickBy"
import {
	ComponentDef,
	getBuilderNamespace,
	getBuilderNamespaces,
	getComponentDefs,
	setDragPath,
	setDropPath,
	setSelectedPath,
	useSelectedPath,
} from "../../../api/stateapi"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"
import { FullPath } from "../../../api/path"
import SearchArea from "../../../helpers/searcharea"
import { add } from "../../../api/defapi"
import ItemTag from "../../../utilities/itemtag/itemtag"

const getUtility = component.getUtility

const addComponentToCanvas = (
	context: context.Context,
	componentDef: ComponentDef,
	extraDef?: definition.Definition
) => {
	const { namespace, name } = componentDef
	const fullName = `${namespace}.${name}` as metadata.MetadataKey
	add(
		context,
		new FullPath(
			"viewdef",
			context.getViewDefId(),
			component.path.fromPath(["components", "0"])
		),
		{
			[fullName]: {
				...(componentDef.defaultDefinition || {}),
				...(extraDef || {}),
			},
		}
	)
}

type VariantsBlockProps = {
	variants: component.ComponentVariant[]
	isSelected: (itemtype: string, itemname: metadata.MetadataKey) => boolean
	component: ComponentDef
}

const VariantsBlockStyleDefaults = Object.freeze({
	root: ["m-2", "flex", "flex-wrap", "gap-2"],
})

const VariantsBlock: definition.UtilityComponent<VariantsBlockProps> = (
	props
) => {
	const { component: componentDef, context, variants, isSelected } = props
	const classes = styles.useUtilityStyleTokens(
		VariantsBlockStyleDefaults,
		props
	)
	const NamespaceLabel = getUtility("uesio/io.namespacelabel")

	return (
		<div className={classes.root}>
			{variants.map((variant) => {
				const variantKey = api.component.getVariantId(variant)

				const nsInfo = getBuilderNamespace(
					context,
					variant.namespace as metadata.MetadataKey
				)

				return (
					<PropNodeTag
						key={variantKey}
						// onClick={(e: MouseEvent) => {
						// 	e.stopPropagation()
						// 	setSelectedPath(
						// 		context,
						// 		new FullPath("componentvariant", variantKey)
						// 	)
						// }}
						onDoubleClick={(e) => {
							// Have to stop propagation to prevent the Component's onDoubleClick
							// from running as well
							e.stopPropagation()
							addComponentToCanvas(context, componentDef, {
								[component.STYLE_VARIANT]:
									metadata.getKey(variant),
							})
						}}
						selected={isSelected("componentvariant", variantKey)}
						draggable={`componentvariant:${variantKey}`}
						context={context}
						variant="uesio/builder.smallpropnodetag"
					>
						<NamespaceLabel
							metadatakey={variant.namespace}
							metadatainfo={nsInfo}
							title={variant.name}
							icon={componentDef.icon}
							context={context}
						/>
					</PropNodeTag>
				)
			})}
		</div>
	)
}

type ComponentBlockProps = {
	componentDef: ComponentDef
	variants: component.ComponentVariant[]
	isSelected: (itemtype: string, itemname: metadata.MetadataKey) => boolean
}

const ComponentBlock: definition.UtilityComponent<ComponentBlockProps> = (
	props
) => {
	const IOExpandPanel = getUtility("uesio/io.expandpanel")
	const { context, componentDef, variants, isSelected } = props
	const { namespace, name } = componentDef
	if (!namespace) throw new Error("Invalid Property Definition")
	const fullName = `${namespace}.${name}` as metadata.MetadataKey

	const allNSInfo = getBuilderNamespaces(context)

	// Filter out variants that aren't in one of our namespaces
	// (this is for filtering out variants from the studio namespace)
	const validVariants = variants?.filter(
		(variant) => !!allNSInfo[variant.namespace]
	)

	return (
		<PropNodeTag
			context={context}
			key={fullName}
			onClick={(e) => {
				// Only run once on a double-click
				if (e.detail > 1) return
				setSelectedPath(context, new FullPath("component", fullName))
			}}
			onDoubleClick={() => {
				addComponentToCanvas(context, componentDef)
			}}
			draggable={`component:${fullName}`}
			selected={isSelected("component", fullName)}
		>
			<ComponentTag component={componentDef} context={context} />
			<IOExpandPanel
				context={context}
				expanded={isSelected("component", fullName)}
			>
				{validVariants && validVariants.length > 0 && (
					<VariantsBlock
						isSelected={isSelected}
						variants={validVariants}
						context={context}
						component={componentDef}
					/>
				)}
			</IOExpandPanel>
		</PropNodeTag>
	)
}

type CategoryBlockProps = {
	components: ComponentDef[]
	variants: Record<string, component.ComponentVariant[]>
	isSelected: (itemtype: string, itemname: metadata.MetadataKey) => boolean
	category: string
}

const CategoryBlockStyleDefaults = Object.freeze({
	categoryLabel: [
		"mx-2",
		"mt-4",
		"-mb-1",
		"text-xs",
		"font-light",
		"text-slate-500",
	],
})

const CategoryBlock: definition.UtilityComponent<CategoryBlockProps> = (
	props
) => {
	const classes = styles.useUtilityStyleTokens(
		CategoryBlockStyleDefaults,
		props
	)
	const { context, components, category, variants, isSelected } = props
	const comps = components
	if (!comps || !comps.length) return null
	comps.sort((a, b) => {
		if (!a.name) return 1
		if (!b.name) return -1
		return a.name.localeCompare(b.name)
	})
	return (
		<>
			<div className={classes.categoryLabel}>{category}</div>
			{comps.map((component) => {
				const { namespace, name } = component
				if (!namespace) throw new Error("Invalid Property Definition")
				const fullName = `${namespace}.${name}`
				return (
					<ComponentBlock
						key={fullName}
						variants={variants[fullName]}
						componentDef={component}
						context={context}
						isSelected={isSelected}
					/>
				)
			})}
		</>
	)
}

type ComponentTagProps = {
	component: ComponentDef
}

const ComponentTag: definition.UtilityComponent<ComponentTagProps> = (
	props
) => {
	const { context, component } = props
	const NamespaceLabel = getUtility("uesio/io.namespacelabel")

	const nsInfo = getBuilderNamespace(
		context,
		component.namespace as metadata.MetadataKey
	)

	return (
		<ItemTag description={component.description} context={context}>
			<NamespaceLabel
				metadatakey={component.namespace}
				metadatainfo={nsInfo}
				title={component.title || component.name}
				context={context}
				icon={component.icon}
			/>
		</ItemTag>
	)
}

const CURSOR_GRABBING = "cursor-grabbing"

const ComponentsPanel: definition.UC = (props) => {
	const ScrollPanel = getUtility("uesio/io.scrollpanel")
	const { context } = props

	const [searchTerm, setSearchTerm] = useState("")
	const searchTermLC = searchTerm?.toLowerCase()
	const components = pickBy(
		getComponentDefs(),
		(component) =>
			component.discoverable &&
			(component.name?.toLowerCase().includes(searchTermLC) ||
				component.description?.toLowerCase().includes(searchTermLC) ||
				component.category?.toLowerCase().includes(searchTermLC))
	)

	const selectedPath = useSelectedPath(context)

	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type) {
			const typeArray = target.dataset.type.split(":")
			const metadataType = typeArray.shift()
			const metadataItem = typeArray.join(":")
			if (metadataType && metadataItem) {
				setDragPath(context, new FullPath(metadataType, metadataItem))
			}
			target.classList.remove(CURSOR_GRABBING)
			target.classList.add(CURSOR_GRABBING)
		}
	}
	const onDragEnd = (e: DragEvent) => {
		setDragPath(context)
		setDropPath(context)
		const target = e.target as HTMLDivElement
		if (target?.classList?.length) {
			target.classList.remove(CURSOR_GRABBING)
		}
	}

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
		Object.values(components || {}),
		(component) => component.category || "UNCATEGORIZED"
	)

	const variants = api.component.useAllVariants()
	const variantsByComponent = groupBy(
		variants,
		(variant) => variant.component
	)

	const isComponentSelected = (
		itemtype: string,
		itemname: metadata.MetadataKey
	) => selectedPath.equals(new FullPath(itemtype, itemname))

	return (
		<ScrollPanel
			header={
				<SearchArea
					id="builder-components-search"
					searchTerm={searchTerm}
					context={context}
					setSearchTerm={setSearchTerm}
				/>
			}
			context={context}
		>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{categoryOrder.map((category) => (
					<CategoryBlock
						key={category}
						variants={variantsByComponent}
						components={componentsByCategory[category]}
						category={category}
						isSelected={isComponentSelected}
						context={context}
					/>
				))}
			</div>
		</ScrollPanel>
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
