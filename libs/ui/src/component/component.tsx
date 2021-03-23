import { FunctionComponent } from "react"
import { DefinitionMap, BaseProps } from "../definition/definition"
import { getURLFromFullName } from "../hooks/fileapi"
import { Context, ContextFrame } from "../context/context"
import { getLoader } from "./registry"
import NotFound from "../components/notfound"
import { ComponentVariant } from "../bands/viewdef/types"
import chroma from "chroma-js"
import { parseKey } from "./path"

type DisplayCondition = {
	field: string
	value: string
}

const cache: Record<string, DefinitionMap> = {}

/**
 * Returns a new object that has a deep merge where source overrides
 * destination, but ignoring empty values in source
 * @param destDef
 * @param sourceDef
 */
function mergeDefinitionMaps(
	destDef: DefinitionMap,
	sourceDef: DefinitionMap,
	context: Context | undefined
) {
	const key = JSON.stringify([destDef, sourceDef])
	if (cache[key]) return cache[key]
	const destClone = JSON.parse(JSON.stringify(destDef))
	const result = mergeDeep(destClone, sourceDef, context)
	cache[key] = result
	return result
}

/**
 * Will ignore null/undefined/empty string in the src obj
 * @param dest
 * @param src
 */
function mergeDeep(
	dest: DefinitionMap,
	src: DefinitionMap,
	context: Context | undefined
): DefinitionMap {
	const srcKeys = Object.keys(src)
	for (const key of srcKeys) {
		if (typeof src[key] === "object" && src[key] !== null) {
			if (!dest[key] || typeof dest[key] !== "object") {
				dest[key] = {}
			}
			mergeDeep(
				dest[key] as DefinitionMap,
				src[key] as DefinitionMap,
				context
			)
			continue
		}

		if (src[key] !== null && src[key] !== undefined && src[key] !== "") {
			// Merge src key base on theme
			const value = src[key]
			dest[key] =
				typeof value === "string" && context
					? inject(value, context)
					: value
		}
	}
	return dest
}

const styleMergeAPIs = {
	theme: (args: string[], context: Context) => {
		const [scope, value, op] = args
		const theme = context.getTheme()
		if (scope === "color") {
			if (op === "darken") {
				return chroma(theme.definition.palette[value]).darken(0.5).hex()
			}
			return theme.definition.palette[value]
		}
		return ""
	},
	color: (args: string[]) => {
		const [color, op] = args
		if (chroma.valid(color)) {
			if (op === "darken") {
				return chroma(color).darken(0.5).hex()
			}
		}
		return ""
	},
	file: (args: string[], context: Context) => {
		const [namespace, name] = args
		return `url("${getURLFromFullName(context, namespace + "." + name)}")`
	},
}

const styleMerge = (
	mergeType: string,
	expression: string,
	context: Context
) => {
	const [apiName, ...args] = expression.split(".")
	if (apiName === "theme" || apiName === "color" || apiName === "file") {
		return styleMergeAPIs[apiName](args, context)
	}
	return ""
}

const inject = (template: string, context: Context): string =>
	template.replace(/\$([.\w]*){(.*?)}/g, (x, mergeType, mergeExpression) =>
		styleMerge(mergeType, mergeExpression, context)
	)

function shouldDisplayCondition(condition: DisplayCondition, context: Context) {
	const record = context.getRecord()
	const value = record?.getFieldValue(condition.field)
	return value === condition.value
}

function shouldDisplay(context: Context, definition?: DefinitionMap) {
	const displayLogic = definition?.["uesio.display"] as DisplayCondition[]
	if (displayLogic && displayLogic.length) {
		for (const condition of displayLogic) {
			if (!shouldDisplayCondition(condition, context)) {
				return false
			}
		}
	}
	return true
}

function additionalContext(context: Context, definition?: DefinitionMap) {
	const additionalContext = definition?.["uesio.context"] as ContextFrame
	if (additionalContext) {
		const workspace = additionalContext.workspace
		if (workspace) {
			return context.addFrame({
				workspace: {
					name: context.merge(workspace.name),
					app: context.merge(workspace.app),
				},
			})
		}
	}
	return context
}

const Component: FunctionComponent<BaseProps> = (props) => {
	const { componentType, path } = props
	return <ComponentInternal {...props} path={`${path}["${componentType}"]`} />
}

function mergeInVariants(
	definition: DefinitionMap | undefined,
	componentType: string,
	variant: ComponentVariant | undefined,
	context: Context
): DefinitionMap | undefined {
	if (!definition) return definition

	const theme = context.getTheme()

	const mergedDefinition = definition["uesio.styles"]
		? {
				...definition,
				...(definition["uesio.styles"] && {
					"uesio.styles": mergeDefinitionMaps(
						{},
						definition["uesio.styles"] as DefinitionMap,
						context
					),
				}),
		  }
		: definition

	if (!variant) return mergedDefinition

	// Loop over variant styles and process merges
	const override =
		theme?.definition?.variantOverrides?.[componentType]?.[variant.name]

	const themedVariant = override
		? {
				...variant,
				definition: mergeDefinitionMaps(
					variant.definition,
					{
						"uesio.styles": override,
					},
					context
				),
		  }
		: variant

	return mergeDefinitionMaps(
		mergedDefinition,
		themedVariant.definition,
		context
	)
}

function mergeContextVariants(
	definition: DefinitionMap | undefined,
	componentType: string,
	context: Context
): DefinitionMap | undefined {
	if (!definition) return definition
	const variantName = definition["uesio.variant"] as string
	const [namespace] = parseKey(componentType)

	return mergeInVariants(
		definition,
		componentType,
		context.getComponentVariant(
			componentType,
			variantName || `${namespace}.default`
		),
		context
	)
}

function render(
	loader: FunctionComponent<BaseProps>,
	componentType: string,
	props: BaseProps
) {
	const { context, definition } = props
	if (!shouldDisplay(context, definition)) return null
	const mergedDefinition = mergeContextVariants(
		definition,
		componentType,
		context
	)
	const Loader = loader
	return (
		<Loader
			{...{ ...props, definition: mergedDefinition }}
			context={additionalContext(context, mergedDefinition)}
		/>
	)
}

const ComponentInternal: FunctionComponent<BaseProps> = (props) => {
	const { componentType, context } = props
	if (!componentType) return <NotFound {...props} />
	const loader =
		getLoader(componentType, !!context.getBuildMode()) || NotFound
	return render(loader, componentType, props)
}

export {
	ComponentInternal,
	Component,
	render,
	mergeInVariants,
	mergeDefinitionMaps,
}
