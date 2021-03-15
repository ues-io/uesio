import { FunctionComponent } from "react"
import { DefinitionMap, BaseProps } from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { getLoader } from "./registry"
import NotFound from "../components/notfound"
import { ComponentVariant } from "../bands/viewdef/types"
import { ThemeState } from "../bands/theme/types"
import chroma from "chroma-js"

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
	theme: ThemeState
) {
	const key = JSON.stringify([destDef, sourceDef])
	if (cache[key]) return cache[key]
	const destClone = JSON.parse(JSON.stringify(destDef))
	const result = mergeDeep(destClone, sourceDef, theme)
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
	theme: ThemeState
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
				theme
			)
			continue
		}

		if (src[key] !== null && src[key] !== undefined && src[key] !== "") {
			// Merge src key base on theme
			const value = src[key]
			dest[key] = typeof value === "string" ? inject(value, theme) : value
		}
	}
	return dest
}

const themeMerge = (
	mergeType: string,
	expression: string,
	theme: ThemeState
) => {
	const [api, scope, value, op] = expression.split(".")

	if (api === "theme") {
		if (scope === "color") {
			if (op === "darken") {
				return chroma(theme.definition.palette[value]).darken(0.5).hex()
			}
			return theme.definition.palette[value]
		}
	}
	if (api === "color") {
		if (chroma.valid(scope)) {
			if (value === "darken") {
				return chroma(scope).darken(0.5).hex()
			}
		}
	}
	return ""
}

const inject = (template: string, theme: ThemeState): string =>
	template.replace(/\$([.\w]*){(.*?)}/g, (x, mergeType, mergeExpression) =>
		themeMerge(mergeType, mergeExpression, theme)
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
	theme: ThemeState
): DefinitionMap | undefined {
	if (!definition || !variant) return definition

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
					theme
				),
		  }
		: variant

	return mergeDefinitionMaps(definition, themedVariant.definition, theme)
}

function mergeContextVariants(
	definition: DefinitionMap | undefined,
	componentType: string,
	context: Context
): DefinitionMap | undefined {
	if (!definition) return definition
	const variantName = definition["uesio.variant"] as string
	if (!variantName) return definition
	const variant = context.getComponentVariant(componentType, variantName)
	return mergeInVariants(
		definition,
		componentType,
		variant,
		context.getTheme()
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

export { ComponentInternal, Component, render, mergeInVariants }
