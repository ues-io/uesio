import {
	DefinitionMap,
	UtilityProps,
	UC,
	UtilityComponent,
} from "../definition/definition"
import {
	injectDynamicContext,
	Context,
	ContextOptions,
} from "../context/context"
import { getRuntimeLoader, getUtilityLoader } from "./registry"
import NotFound from "../components/notfound"
import { parseKey } from "./path"
import { ComponentVariant } from "../definition/componentvariant"
import ErrorBoundary from "../components/errorboundary"
import { mergeDefinitionMaps } from "./merge"
import { MetadataKey } from "../bands/builder/types"
import { useShould } from "./display"

const getVariantKey = (variant: ComponentVariant): MetadataKey =>
	`${variant.namespace}.${variant.name}` as MetadataKey

function getThemeOverride(
	variant: ComponentVariant,
	context: Context
): DefinitionMap {
	const componentType = variant.component
	const theme = context.getTheme()
	const overrides = theme?.definition?.variantOverrides
	const override = overrides?.[componentType]?.[
		getVariantKey(variant)
	] as DefinitionMap
	return override
}

// A cache of full variant definitions, where all variant extensions have been resolved
// NOTE: This cache will be persisted across all route navigations, and has no upper bound.
// Consider adding a cache eviction policy if this becomes a problem.
const expandedVariantDefinitionCache = {} as Record<string, DefinitionMap>

function getDefinitionFromVariant(
	variant: ComponentVariant | undefined,
	context: Context
): DefinitionMap {
	if (!variant) return {}
	let def = variant.definition
	if (variant.extends) {
		// To avoid expensive variant extension resolution, check cache first
		const variantKey = `${variant.component}:${getVariantKey(variant)}`
		const cachedDef = expandedVariantDefinitionCache[variantKey]
		if (cachedDef) {
			def = cachedDef
		} else {
			def = expandedVariantDefinitionCache[variantKey] =
				mergeDefinitionMaps(
					getDefinitionFromVariant(
						context.getComponentVariant(
							variant.component,
							variant.extends as MetadataKey
						),
						context
					),
					def,
					undefined
				)
		}
	}

	const override = getThemeOverride(variant, context)
	if (!override) return def
	return mergeDefinitionMaps(def, { "uesio.styles": override }, undefined)
}

function mergeContextVariants(
	definition: DefinitionMap | undefined,
	componentType: MetadataKey,
	context: Context
): DefinitionMap | undefined {
	if (!definition) return definition
	const variantName = definition["uesio.variant"] as MetadataKey
	const [namespace] = parseKey(componentType)

	if (!definition) return definition
	const variant = context.getComponentVariant(
		componentType,
		variantName || (`${namespace}.default` as MetadataKey)
	)
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return mergeDefinitionMaps(variantDefinition, definition, undefined)
}

const Component: UC<DefinitionMap> = (props) => {
	const { componentType, context, definition } = props
	if (!useShould(definition?.["uesio.display"], context)) return null
	if (!componentType) return <NotFound {...props} />
	const Loader = getRuntimeLoader(componentType) || NotFound

	const mergedDefinition = mergeContextVariants(
		definition,
		componentType,
		context
	)
	return (
		<ErrorBoundary {...props}>
			<Loader
				{...props}
				definition={mergedDefinition || {}}
				context={injectDynamicContext(
					context,
					mergedDefinition?.["uesio.context"] as ContextOptions
				)}
			/>
		</ErrorBoundary>
	)
}

Component.displayName = "Component"

const parseVariantName = (
	fullName: MetadataKey | undefined,
	key: MetadataKey
): [MetadataKey, MetadataKey] => {
	const parts = fullName?.split(":")
	if (parts?.length === 2) {
		return [parts[0] as MetadataKey, parts[1] as MetadataKey]
	}
	if (parts?.length === 1) {
		return [key, parts[0] as MetadataKey]
	}
	const [keyNamespace] = parseKey(key)
	return [key, `${keyNamespace}.default` as MetadataKey]
}

// This is bad and should eventually go away when we do proper typing
// for utilities.
interface UtilityPropsPlus extends UtilityProps {
	[x: string]: unknown
}

const getUtility = <T extends UtilityProps = UtilityPropsPlus>(
	key: MetadataKey
) => getUtilityLoader(key) as UtilityComponent<T>

export { Component, getDefinitionFromVariant, getUtility, parseVariantName }
