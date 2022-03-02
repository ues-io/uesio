import { FunctionComponent } from "react"
import {
	DefinitionMap,
	BaseProps,
	UtilityPropsPlus,
} from "../definition/definition"
import { Context, ContextFrame } from "../context/context"
import { getLoader } from "./registry"
import NotFound from "../components/notfound"
import { parseKey } from "./path"
import { shouldDisplay } from "./display"
import { ComponentVariant } from "../bands/componentvariant/types"

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
	//const key = JSON.stringify([destDef, sourceDef])
	//if (cache[key]) return cache[key]
	const destClone = JSON.parse(JSON.stringify(destDef))
	const result = mergeDeep(destClone, sourceDef, context)
	//cache[key] = result
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
	if (!src) return dest
	const srcKeys = Object.keys(src)
	for (const key of srcKeys) {
		if (typeof src[key] === "object" && src[key] !== null) {
			if (Array.isArray(src[key])) {
				// Just bail on arrays and set dest to src
				// Can't really merge them well.
				dest[key] = src[key]
				continue
			}
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
					? context.merge(value)
					: value
		}
	}
	return dest
}

function additionalContext(context: Context, additional: ContextFrame) {
	if (additional) {
		const frame: ContextFrame = {}
		const workspace = additional.workspace
		const siteadmin = additional.siteadmin
		if (workspace) {
			frame.workspace = {
				name: context.merge(workspace.name),
				app: context.merge(workspace.app),
			}
		}
		if (siteadmin) {
			frame.siteadmin = {
				name: context.merge(siteadmin.name),
				app: context.merge(siteadmin.app),
			}
		}
		const wire = additional.wire
		if (wire) {
			frame.wire = wire
		}
		return context.addFrame(frame)
	}
	return context
}

const Component: FunctionComponent<BaseProps> = (props) => {
	const { componentType, path } = props
	return <ComponentInternal {...props} path={`${path}["${componentType}"]`} />
}

function getThemeOverride(
	variant: ComponentVariant,
	context: Context
): DefinitionMap {
	const componentType = variant.component
	const theme = context.getTheme()
	const overrides = theme?.definition?.variantOverrides
	const override = overrides?.[componentType]?.[
		variant.namespace + "." + variant.name
	] as DefinitionMap
	return override
}

function getDefinitionFromVariant(
	variant: ComponentVariant | undefined,
	context: Context
): DefinitionMap {
	if (!variant) return {}
	const def = variant.extends
		? mergeDefinitionMaps(
				getDefinitionFromVariant(
					context.getComponentVariant(
						variant.component,
						variant.extends
					),
					context
				),
				variant.definition,
				undefined
		  )
		: variant.definition

	const override = getThemeOverride(variant, context)
	return mergeDefinitionMaps(
		def,
		override ? { "uesio.styles": override } : {},
		undefined
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

	if (!definition) return definition
	const variant = context.getComponentVariant(
		componentType,
		variantName || `${namespace}.default`
	)
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return mergeDefinitionMaps(variantDefinition, definition, undefined)
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
	return renderUtility(loader, {
		...props,
		definition: mergedDefinition,
		context: additionalContext(
			context,
			mergedDefinition?.["uesio.context"] as ContextFrame
		),
	})
}

function renderUtility(
	loader: FunctionComponent<UtilityPropsPlus>,
	props: UtilityPropsPlus
) {
	const Loader = loader
	loader.displayName = props.componentType as string
	return <Loader {...props} />
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
	renderUtility,
	mergeDefinitionMaps,
	getDefinitionFromVariant,
	additionalContext,
}
