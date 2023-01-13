import { FC, DragEvent } from "react"
import { definition, component, api, styles, metadata } from "@uesio/ui"

import groupBy from "lodash/groupBy"
import pickBy from "lodash/pickBy"
import {
	ComponentDef,
	FullPath,
	getBuilderNamespaces,
	getComponentDefs,
	PathSelector,
	useDragPath,
	useDropPath,
	useSelectedPath,
} from "../../../api/stateapi"
import NamespaceLabel from "../../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"

const Text = component.getUtility("uesio/io.text")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

type VariantsBlockProps = {
	variants: component.ComponentVariant[]
	isSelected: (itemtype: string, itemname: metadata.MetadataKey) => boolean
	setSelected: PathSelector
} & definition.UtilityProps

const VariantsBlock: FC<VariantsBlockProps> = (props) => {
	const { context, variants, isSelected, setSelected } = props

	const classes = styles.useUtilityStyles(
		{
			root: {
				padding: "0px 10px 10px 10px",
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			{variants.map((variant) => {
				const variantKey = api.component.getVariantId(variant)

				return (
					<PropNodeTag
						key={variantKey}
						onClick={(e: MouseEvent) => {
							e.stopPropagation()
							setSelected(
								new FullPath("componentvariant", variantKey)
							)
						}}
						selected={isSelected("componentvariant", variantKey)}
						draggable={`componentvariant:${variantKey}`}
						context={context}
						variant="uesio/builder.smallpropnodetag"
					>
						<NamespaceLabel
							metadatakey={variant.namespace}
							title={variant.name}
							context={context}
						/>
					</PropNodeTag>
				)
			})}
		</div>
	)
}

type ComponentBlockProps = {
	component: ComponentDef
	variants: component.ComponentVariant[]
	isSelected: (itemtype: string, itemname: metadata.MetadataKey) => boolean
	setSelected: PathSelector
} & definition.UtilityProps

const ComponentBlock: FC<ComponentBlockProps> = (props) => {
	const { context, component, variants, isSelected, setSelected } = props
	const { namespace, name } = component
	if (!namespace) throw new Error("Invalid Property Definition")
	const fullName = `${namespace}.${name}` as metadata.MetadataKey

	const allNSInfo = getBuilderNamespaces(context)

	// Filter out variants that aren't in one of our namespaces
	// (this is for filtering out variants from the studio namespace)
	const validVariants = variants?.filter(
		(variant) => !!allNSInfo[variant.namespace]
	)

	// Loop over the variants for this component
	return (
		<PropNodeTag
			context={context}
			key={fullName}
			onClick={() => {
				setSelected(new FullPath("componenttype", fullName))
			}}
			draggable={`component:${fullName}`}
			selected={isSelected("componenttype", fullName)}
		>
			<ComponentTag component={component} context={context} />
			<IOExpandPanel
				context={context}
				expanded={isSelected("componenttype", fullName)}
			>
				{validVariants && validVariants.length > 0 && (
					<VariantsBlock
						isSelected={isSelected}
						setSelected={setSelected}
						variants={validVariants}
						context={context}
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
	setSelected: PathSelector
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
	const { context, components, category, variants, isSelected, setSelected } =
		props
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
						component={component}
						context={context}
						isSelected={isSelected}
						setSelected={setSelected}
					/>
				)
			})}
		</>
	)
}

type ComponentTagProps = {
	component: ComponentDef
} & definition.UtilityProps

const ComponentTag: FC<ComponentTagProps> = (props) => {
	const { context, component } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
			title: {
				verticalAlign: "middle",
				marginBottom: "0.5em",
			},
			desc: {
				fontSize: "0.9em",
				fontWeight: 300,
				margin: "0",
			},
		},
		props
	)
	return (
		<div className={classes.root}>
			<NamespaceLabel
				metadatakey={component.namespace}
				title={component.title || component.name}
				context={context}
				classes={{
					root: classes.title,
				}}
			/>

			<Text
				element="p"
				text={component.description}
				context={context}
				classes={{
					root: classes.desc,
				}}
			/>
		</div>
	)
}

const ComponentsPanel: definition.UtilityComponent = (props) => {
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
	const components = pickBy(
		getComponentDefs(context),
		(component) => component.discoverable
	)

	const [selectedPath, setSelected] = useSelectedPath(context)
	const [, setDragPath] = useDragPath(context)
	const [, setDropPath] = useDropPath(context)

	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type) {
			const typeArray = target.dataset.type.split(":")
			const metadataType = typeArray.shift()
			const metadataItem = typeArray.join(":")
			if (metadataType && metadataItem) {
				setDragPath(new FullPath(metadataType, metadataItem))
			}
		}
	}
	const onDragEnd = () => {
		setDragPath()
		setDropPath()
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
		<div
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			className={classes.root}
		>
			{categoryOrder.map((category) => (
				<CategoryBlock
					key={category}
					variants={variantsByComponent}
					components={componentsByCategory[category]}
					category={category}
					isSelected={isComponentSelected}
					setSelected={setSelected}
					context={context}
				/>
			))}
		</div>
	)
}
ComponentsPanel.displayName = "ComponentsPanel"

export default ComponentsPanel
