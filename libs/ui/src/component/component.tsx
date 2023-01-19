import {
	DefinitionMap,
	UtilityProps,
	UC,
	UtilityComponent,
} from "../definition/definition"
import { injectDynamicContext, Context, ContextFrame } from "../context/context"
import { getRuntimeLoader, getUtilityLoader } from "./registry"
import NotFound from "../components/notfound"
import { parseKey } from "./path"
import { ComponentVariant } from "../definition/componentvariant"
import ErrorBoundary from "../components/errorboundary"
import { mergeDefinitionMaps } from "./merge"
import { MetadataKey } from "../bands/builder/types"
import { useShould } from "./display"

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
						variant.extends as MetadataKey
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

const Component: UC<Record<string, unknown>> = (props) => {
	const { componentType, context, definition } = props
	if (definition && !useShould(definition["uesio.display"], context))
		return null
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
					mergedDefinition?.["uesio.context"] as ContextFrame
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

export {
	Component,
	getDefinitionFromVariant,
	additionalContext,
	getUtility,
	parseVariantName,
}
