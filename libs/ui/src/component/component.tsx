import {
	DefinitionMap,
	UtilityProps,
	UC,
	UtilityComponent,
	BaseDefinition,
	DefinitionList,
} from "../definition/definition"
import {
	injectDynamicContext,
	Context,
	ContextOptions,
	Mergeable,
} from "../context/context"
import { getRuntimeLoader, getUtilityLoader } from "./registry"
import NotFound from "../utilities/notfound"
import { parseKey } from "./path"
import { ComponentVariant } from "../definition/componentvariant"
import ErrorBoundary from "../utilities/errorboundary"
import { mergeDefinitionMaps } from "./merge"
import { MetadataKey } from "../metadata/types"
import { useShould } from "./display"
import { component } from ".."
import { getKey } from "../metadata/metadata"
import { getComponentType } from "../bands/componenttype/selectors"
import {
	ComponentProperty,
	Declarative,
	DeclarativeComponent as DeclarativeComponentDef,
	SlotDef,
} from "../definition/component"
import { COMPONENT_CONTEXT, DISPLAY_CONDITIONS } from "../componentexports"
import Slot, { DefaultSlotName } from "../utilities/slot"

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

type DeclarativeComponentSlotContext = {
	componentType: MetadataKey
	path: string
	slotDefinitions: Record<string, DefinitionMap>
}

const DECLARATIVE_COMPONENT = "uesio/core.declarativecomponent"

// Remove all Slot properties from a Declarative Component definition,
// using Slot definitions from Component metadata.
const stripSlotsFromDefinition = (
	definition: BaseDefinition,
	slots?: SlotDef[]
) => {
	if (!slots || !slots.length) return definition
	const props = {
		...definition,
	} as Record<string, unknown>
	slots.forEach((slot) => {
		delete props[slot.name]
	})
	return props as BaseDefinition
}

/**
 * Constructs a DefinitionList to use for rendering a Declarative Component
 * by merging the provided properties, and then injecting them into the component type's definition's
 * "$Prop{propName}" placeholders.
 */
const resolveDeclarativeComponentDefinition = (
	context: Context,
	definition: BaseDefinition,
	componentTypeDef: DeclarativeComponentDef
): DefinitionList =>
	(context
		.addPropsFrame(
			context.mergeDeep(
				stripSlotsFromDefinition(
					definition,
					componentTypeDef.slots
				) as unknown as Record<string, Mergeable>
			) as Record<string, unknown>
		)
		// definition may not be Record<string, string>, but we just need to be able to merge it,
		// so we need to cast it.
		.mergeList(
			componentTypeDef.definition as Record<string, string>[]
		) as DefinitionList) || []

function addDefaultPropertyAndSlotValues(
	def: DefinitionMap,
	componentTypeDef?: component.ComponentDef
) {
	const propsWithDefaults = componentTypeDef?.properties?.filter(
		(prop) => prop.defaultValue !== undefined
	)
	const slotsWithDefaults = componentTypeDef?.slots?.filter(
		(prop) => prop.defaultContent !== undefined
	)
	const havePropsWithDefaults =
		propsWithDefaults && propsWithDefaults.length > 0
	const haveSlotsWithDefaults =
		slotsWithDefaults && slotsWithDefaults.length > 0
	// Shortcut - if we have no defaults, we are done
	if (!havePropsWithDefaults && !haveSlotsWithDefaults) return def
	const defaults = {} as DefinitionMap
	if (havePropsWithDefaults) {
		propsWithDefaults.forEach((prop: ComponentProperty) => {
			const { defaultValue, name } = prop
			if (typeof def[name] === "undefined" || def[name] === null) {
				defaults[name] = defaultValue
			}
		})
	}
	if (haveSlotsWithDefaults) {
		slotsWithDefaults.forEach((slot: SlotDef) => {
			const { defaultContent, name } = slot
			if (typeof def[name] === "undefined" || def[name] === null) {
				defaults[name] = defaultContent
			}
		})
	}
	// Shortcut - if all properties were populated, no need to do a merge
	if (Object.keys(defaults).length === 0) return def
	// Merge defaults into definition
	return {
		...defaults,
		...def,
	}
}

const DeclarativeComponent: UC<DeclarativeProps> = (props) => {
	const { componentType, context, definition, path } = props
	if (!componentType) return null
	const componentTypeDef = getComponentType(
		componentType
	) as DeclarativeComponentDef
	if (!componentTypeDef) return null
	const { slots } = componentTypeDef
	// Merge YAML-defined properties into the Declarative Component definition
	// by adding a props frame, to resolve all "$Prop{propName}" merges.
	// These properties will NOT be accessible to child components.
	const actualDefinition = resolveDeclarativeComponentDefinition(
		context,
		definition,
		componentTypeDef
	)
	// Add a Props frame containing any Slots, so that any Slot components
	// which are children of this component can access the slot definitions.
	const actualContext =
		slots && slots.length
			? context.addComponentFrame(DECLARATIVE_COMPONENT, {
					componentType,
					// TODO: Support non-top-level slots using the path property
					slotDefinitions: slots.reduce(
						(acc, slot) => ({
							...acc,
							[slot.name]: (definition as DefinitionMap)[
								slot.name
							],
						}),
						{}
					),
					path,
			  } as DeclarativeComponentSlotContext)
			: context
	return (
		<Slot
			context={actualContext}
			path={path}
			listName={DefaultSlotName}
			definition={{ [DefaultSlotName]: actualDefinition }}
			componentType={componentType}
		/>
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

	const componentTypeDef = getComponentType(componentType)

	if (!Loader) {
		// Check if this is a declarative component, and if so use the declarative loader
		if (componentTypeDef?.type === Declarative) {
			Loader = DeclarativeComponent
		}
	}

	if (!Loader) {
		return <NotFound {...props} />
	}

	const mergedDefinition = addDefaultPropertyAndSlotValues(
		mergeContextVariants(definition, componentType, context) || {},
		componentTypeDef
	)

	return (
		<ErrorBoundary {...props}>
			<Loader
				{...props}
				definition={mergedDefinition}
				context={injectDynamicContext(
					context,
					mergedDefinition?.[COMPONENT_CONTEXT] as ContextOptions
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
	addDefaultPropertyAndSlotValues,
	Component,
	DECLARATIVE_COMPONENT,
	getDefinitionFromVariant,
	getUtility,
	parseVariantName,
	resolveDeclarativeComponentDefinition,
}

export type { DeclarativeComponentSlotContext }
