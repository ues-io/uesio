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
} from "../context/context"
import { getRuntimeLoader, getUtilityLoader } from "./registry"
import NotFound from "../utilities/notfound"
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
import { FieldValue } from "../bands/wirerecord/types"
import type { Component as ComponentDef } from "../definition/component"

// A cache of full variant definitions, where all variant extensions have been resolved
// NOTE: This cache will be persisted across all route navigations, and has no upper bound.
// Consider adding a cache eviction policy if this becomes a problem.
const expandedVariantDefinitionCache = {} as Record<string, DefinitionMap>

function getDefinitionFromVariant(
  variant: ComponentVariant | undefined,
  context: Context,
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
        variant.extends as MetadataKey,
      ),
      context,
    ),
    variant.definition,
    undefined,
  ))
}

function mergeContextVariants(
  definition: DefinitionMap | undefined,
  componentType: MetadataKey,
  componentTypeDef: ComponentDef,
  context: Context,
): DefinitionMap | undefined {
  if (!definition) return definition
  let variantName = definition[component.STYLE_VARIANT] as MetadataKey
  if (!variantName && componentTypeDef?.defaultVariant) {
    // update the definition with the default variant to ensure
    // downstream usage can rely on the definition
    variantName = componentTypeDef.defaultVariant
    definition = {
      ...definition,
      [component.STYLE_VARIANT]: variantName,
    }
  }
  const variant = context.getComponentVariant(componentType, variantName)
  const variantDefinition = getDefinitionFromVariant(variant, context)
  return mergeDefinitionMaps(
    componentTypeDef?.type === Declarative
      ? variantDefinition
      : removeStylesNode(variantDefinition),
    definition,
    undefined,
  )
}

function removeStylesNode(definition: DefinitionMap): DefinitionMap {
  if (!definition) return {}
  const { [component.STYLE_TOKENS]: value, ...variantDefinitionWithoutStyle } =
    definition
  return variantDefinitionWithoutStyle
}

type DeclarativeProps = {
  definition: BaseDefinition
}

const DECLARATIVE_COMPONENT = "uesio/core.declarativecomponent"

const propMergeOptions = {
  types: ["Prop" as const, "Region" as const, "Slot" as const],
}

/**
 * Constructs a DefinitionList to use for rendering a Declarative Component
 * by merging the provided properties, and then injecting them into the component type's definition's
 * "$Prop{propName}" placeholders.
 */
const resolveDeclarativeComponentDefinition = (
  context: Context,
  source: Record<string, FieldValue>,
  destination: DefinitionList,
  slots: SlotDef[] | undefined,
  path: string,
  componentType: string,
): DefinitionList =>
  (context
    .addPropsFrame(source, path, componentType, slots)
    // definition may not be Record<string, string>, but we just need to be able to merge it,
    // so we need to cast it.
    .mergeList(
      destination as Record<string, string>[],
      propMergeOptions,
    ) as DefinitionList) || []

function addDefaultPropertyAndSlotValues(
  def: DefinitionMap,
  properties: ComponentProperty[] | undefined,
  slots: SlotDef[] | undefined,
  componentType: string,
  path: string,
  context: Context,
) {
  const propsWithDefaults = properties?.filter(
    (prop) => prop.defaultValue !== undefined,
  )
  const slotsWithDefaults = slots?.filter(
    (prop) => prop.defaultContent !== undefined,
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
      const value = def[name]
      if (typeof value === "undefined" || value === null || value === "") {
        defaults[name] = defaultValue
      }
    })
  }

  if (haveSlotsWithDefaults) {
    context = context.addPropsFrame(
      def as Record<string, FieldValue>,
      path,
      componentType,
      slots,
    )
    slotsWithDefaults.forEach((slot: SlotDef) => {
      const { defaultContent, name } = slot
      if (typeof def[name] === "undefined" || def[name] === null) {
        defaults[name] = context
          ? context.mergeList(
              defaultContent as Record<string, string>[],
              propMergeOptions,
            )
          : defaultContent
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
    componentType,
  ) as DeclarativeComponentDef
  if (!componentTypeDef) return null

  // Merge YAML-defined properties into the Declarative Component definition
  // by adding a props frame, to resolve all "$Prop{propName}" merges.
  // These properties will NOT be accessible to child components.
  const actualDefinition = resolveDeclarativeComponentDefinition(
    context,
    definition as Record<string, FieldValue>,
    componentTypeDef.definition,
    componentTypeDef.slots,
    path,
    componentType,
  )

  return (
    <Slot
      context={context.addComponentFrame(DECLARATIVE_COMPONENT, {
        componentType,
        path,
      })}
      readonly={true}
      path={path}
      listName={DefaultSlotName}
      definition={{ [DefaultSlotName]: actualDefinition }}
      componentType={componentType}
    />
  )
}

DeclarativeComponent.displayName = "DeclarativeComponent"

const Component: UC<DefinitionMap> = (props) => {
  const { componentType, context, definition, path } = props
  if (!useShould(definition?.[DISPLAY_CONDITIONS], context)) {
    return null
  }
  if (!componentType) return <NotFound {...props} />

  const componentTypeDef = getComponentType(componentType)
  const Loader: UC | undefined =
    componentTypeDef?.type === Declarative
      ? DeclarativeComponent
      : getRuntimeLoader(componentType)

  if (!Loader) {
    return <NotFound {...props} />
  }

  const mergedDefinition = addDefaultPropertyAndSlotValues(
    mergeContextVariants(
      definition,
      componentType,
      componentTypeDef,
      context,
    ) || {},
    componentTypeDef?.properties,
    componentTypeDef?.slots,
    componentType,
    path,
    context,
  )

  return (
    <ErrorBoundary {...props}>
      <Loader
        {...props}
        definition={mergedDefinition}
        context={injectDynamicContext(
          context,
          mergedDefinition?.[COMPONENT_CONTEXT] as ContextOptions,
        )}
      />
    </ErrorBoundary>
  )
}

Component.displayName = "Component"

const parseVariantName = (
  fullName: MetadataKey | undefined,
  key: MetadataKey,
): [MetadataKey, MetadataKey] | undefined => {
  return fullName
    ? parseVariantNameFromFullName(fullName, key)
    : parseVariantNameFromKey(key)
}

const parseVariantNameFromFullName = (
  fullName: MetadataKey,
  key: MetadataKey,
): [MetadataKey, MetadataKey] | undefined => {
  const parts = fullName.split(":")
  if (parts.length === 2 && parts[0] && parts[1]) {
    return [parts[0] as MetadataKey, parts[1] as MetadataKey]
  }
  if (parts.length === 1 && parts[0]) {
    return [key, parts[0] as MetadataKey]
  }

  // fullName could be empty or one of the parts could be empty
  console.error(`Unable to parse variant name '${fullName}' for key '${key}'`)
  return undefined
}

const parseVariantNameFromKey = (
  key: MetadataKey,
): [MetadataKey, MetadataKey] | undefined => {
  const componentTypeDef = getComponentType(key)
  if (!componentTypeDef) {
    console.error(`Unable to find component type definition for key '${key}'`)
    return undefined
  }

  return !componentTypeDef.defaultVariant
    ? undefined
    : parseVariantNameFromFullName(componentTypeDef.defaultVariant, key)
}

// This is bad and should eventually go away when we do proper typing
// for utilities.
interface UtilityPropsPlus extends UtilityProps {
  [x: string]: unknown
}

const getUtility = <T extends UtilityProps = UtilityPropsPlus>(
  key: MetadataKey,
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
