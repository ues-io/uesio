import {
	DefinitionMap,
	UtilityProps,
	UC,
	UtilityComponent,
	BaseDefinition,
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
import { MetadataKey } from "../metadata/types"
import { useShould } from "./display"
import { DISPLAY_CONDITIONS, Slot } from "../componentexports"
import { component } from ".."
import { getKey } from "../metadata/metadata"
import { getComponentIdFromProps } from "../hooks/componentapi"
import { getComponentType } from "../bands/componenttype/selectors"
import { Declarative, DeclarativeComponent } from "../definition/component"

// A cache of full variant definitions, where all variant extensions have been resolved
// NOTE: This cache will be persisted across all route navigations, and has no upper bound.
// Consider adding a cache eviction policy if this becomes a problem.
const expandedVariantDefinitionCache = {} as Record<string, DefinitionMap>

function getDefinitionFromVariant(
	variant: ComponentVariant | undefined,
	context: Context
): DefinitionMap {
	if (!variant) return {}
	if (!variant.extends) return variant.definition

	// To avoid expensive variant extension resolution, check cache first
	const variantKey = `${variant.component}:${getKey(variant)}`
	const cachedDef = expandedVariantDefinitionCache[variantKey]
	if (cachedDef) return cachedDef
	return (expandedVariantDefinitionCache[variantKey] = mergeDefinitionMaps(
		getDefinitionFromVariant(
			context.getComponentVariant(
				variant.component,
				variant.extends as MetadataKey
			),
			context
		),
		variant.definition,
		undefined
	))
}

function mergeContextVariants(
	definition: DefinitionMap | undefined,
	componentType: MetadataKey,
	context: Context
): DefinitionMap | undefined {
	if (!definition) return definition
	const variantName = definition[component.STYLE_VARIANT] as MetadataKey
	const [namespace] = parseKey(componentType)
	const variant = context.getComponentVariant(
		componentType,
		variantName || (`${namespace}.default` as MetadataKey)
	)
	const variantDefinition = getDefinitionFromVariant(variant, context)
	return mergeDefinitionMaps(variantDefinition, definition, undefined)
}

type DeclarativeProps = {
	definition: BaseDefinition
}

const DeclarativeComponent: UC<DeclarativeProps> = (props) => {
	const { componentType, context, definition, path } = props
	if (!componentType) return null
	const componentTypeDef = getComponentType(
		componentType
	) as DeclarativeComponent
	if (!componentTypeDef) return null
	const slotDef =
		(context
			.addPropsFrame(definition)
			// definition may not be Record<string, string>, but we just need to be able to merge it,
			// so we need to cast it.
			.mergeDeep(
				componentTypeDef.definition as Record<string, string>
			) as DefinitionMap) || {}
	return (
		<div id={getComponentIdFromProps(props)}>
			<Slot
				definition={slotDef}
				listName="components"
				path={path}
				context={context}
			/>
		</div>
	)
}

DeclarativeComponent.displayName = "DeclarativeComponent"

const Component: UC<DefinitionMap> = (props) => {
	const { componentType, context, definition } = props
	if (!useShould(definition?.[DISPLAY_CONDITIONS], context)) {
		return null
	}
	if (!componentType) return <NotFound {...props} />

	let Loader = getRuntimeLoader(componentType) as UC | undefined

	if (!Loader) {
		// Check if this is a declarative component, and if so use the declarative loader
		const componentTypeDef = getComponentType(componentType)
		if (componentTypeDef?.type === Declarative) {
			Loader = DeclarativeComponent
		}
	}

	if (!Loader) {
		return <NotFound {...props} />
	}

	const mergedDefinition =
		mergeContextVariants(definition, componentType, context) || {}

	return (
		<ErrorBoundary {...props}>
			<Loader
				{...props}
				definition={mergedDefinition}
				context={injectDynamicContext(
					context,
					definition?.["uesio.context"] as ContextOptions
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
