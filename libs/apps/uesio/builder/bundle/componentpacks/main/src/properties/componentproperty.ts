import { component, context, definition, metadata, wire } from "@uesio/ui"
import { PropertiesPanelSection } from "../api/propertysection"
import { FullPath } from "../api/path"
import { ReactElement } from "react"

type FieldUpdate = {
  field: string
  // If value is undefined, then the field's value will be cleared from YAML definition.
  value?: wire.FieldValue
}

type PropertyOnChange = {
  conditions?: component.DisplayCondition[]
  updates: FieldUpdate[]
}

type BaseProperty = {
  name: string
  label?: string
  required?: boolean
  type: string
  // defaultValue will be used at runtime if the property is not set in the YAML definition.
  // It will also be used as the placeholder if no placeholder is specified.
  defaultValue?: wire.FieldValue
  // placeholder defines what placeholder text is displayed in the property editor.
  placeholder?: string
  // readonly will prevent the property from being edited in the properties UI.
  readonly?: boolean
  // If false, then the property will be stored in local state and YAML definition,
  // but will not be displayed in the properties UI.
  display?: boolean
  // If false, then the property will be be stored ONLY in local state,
  // but will NOT be stored in the YAML definition.
  viewOnly?: boolean
  displayConditions?: component.DisplayCondition[]
  // Updates to perform when this property's value is changed.
  onChange?: PropertyOnChange[]
  unique?: boolean
}
type TextProperty = {
  type: "TEXT"
} & BaseProperty

type LongTextProperty = {
  type: "LONGTEXT"
} & BaseProperty

type ParamProperty = {
  type: "PARAM"
} & BaseProperty

type ComponentIdProperty = {
  name: "uesio.id"
  type: "COMPONENT_ID"
} & BaseProperty

type BotProperty = {
  type: "BOT"
  namespace?: string
  botType: "LISTENER"
} & BaseProperty

type NumberProperty = {
  type: "NUMBER"
  min?: number
  max?: number
  step?: number
} & BaseProperty

type KeyProperty = {
  type: "KEY"
} & BaseProperty

type MetadataMetadata = {
  type: metadata.MetadataType
  grouping?: string
}

type MetadataProperty = {
  type: "METADATA"
  metadata: MetadataMetadata
} & BaseProperty

type MultiMetadataProperty = {
  type: "MULTIMETADATA"
  metadata: MetadataMetadata
} & BaseProperty

type NamespaceProperty = {
  type: "NAMESPACE"
} & BaseProperty

type CheckboxProperty = {
  type: "CHECKBOX"
} & BaseProperty

type ConditionProperty = {
  type: "CONDITION"
  wire?: string
  wireField?: string
  filter?: (def: wire.WireConditionState) => boolean
} & BaseProperty

type WireProperty = {
  type: "WIRE"
  filter?: (def: wire.RegularWireDefinition) => boolean
  defaultToContext?: boolean
} & BaseProperty

type WiresProperty = {
  type: "WIRES"
} & BaseProperty

type FieldMetadataProperty = {
  type: "FIELD_METADATA"
  fieldProperty: string
  metadataProperty: wire.FieldMetadataPropertyPath
  wireProperty?: string
  wireName?: string
} & BaseProperty

type FieldPropertyBase = {
  wireField?: string
  wireName?: string
  wirePath?: string
} & BaseProperty

// FIELD / FIELDS are for selecting fields in a WIRE.
type FieldProperty = {
  type: "FIELD"
} & FieldPropertyBase
type FieldsProperty = {
  type: "FIELDS"
} & FieldPropertyBase

// FIELD_VALUE / FIELD_VALUES
type FieldValuePropertyBase = {
  wireProperty?: string
  fieldProperty: string
  wirePath?: string
} & BaseProperty

type FieldValueProperty = {
  type: "FIELD_VALUE"
} & FieldValuePropertyBase
type FieldValuesProperty = {
  type: "FIELD_VALUES"
} & FieldValuePropertyBase

type CollectionFieldPropertyBase = {
  collectionName?: string
  collectionPath?: string
  allowReferenceTraversal?: boolean
} & BaseProperty

// COLLECTION_FIELD / COLLECTION_FIELDS are for selecting fields in a COLLECTION.
type CollectionFieldProperty = {
  type: "COLLECTION_FIELD"
} & CollectionFieldPropertyBase
type CollectionFieldsProperty = {
  type: "COLLECTION_FIELDS"
} & CollectionFieldPropertyBase

type SelectProperty = {
  type: "SELECT"
  selectList?: string
  options?: wire.SelectOption[]
  required?: boolean
  blankOptionLabel?: string
} & BaseProperty

type MapProperty = {
  type: "MAP"
  content: definition.DefinitionList
  defaultDefinition?: definition.DefinitionMap
  defaultKey: string
  actions?: PropertyAction[]
} & BaseProperty

type StructProperty = {
  type: "STRUCT"
  properties: ComponentProperty[]
} & BaseProperty

type ComponentPropertiesGetter = (
  record: wire.PlainWireRecord,
  context: context.Context,
) => ComponentProperty[]

type DisplayTemplateGetter = (record: wire.PlainWireRecord) => string

interface ListPropertyActionOptions {
  context: context.Context
  path: FullPath
  items: definition.DefinitionMap[]
}

interface ListPropertyItemChildrenFunctionOptions {
  context: context.Context
  path: FullPath
  item: wire.PlainWireRecord
  index: number
}

type ListPropertyItemChildrenFunction = (
  options: ListPropertyItemChildrenFunctionOptions,
) => ReactElement | null

type ListPropertyActionFunction = (options: ListPropertyActionOptions) => void

interface PropertyAction {
  icon?: string
  label?: string
  defaultDefinition?: definition.DefinitionMap
  action?: ListPropertyActionFunction
}

interface ListPropertyItemsDefinition {
  actions?: PropertyAction[]
  addLabel?: string
  defaultDefinition?: definition.DefinitionMap
  displayTemplate?: string | DisplayTemplateGetter
  properties?: ComponentProperty[] | ComponentPropertiesGetter
  sections?: PropertiesPanelSection[]
  title?: string
  children?: ListPropertyItemChildrenFunction
}

type ListProperty = {
  type: "LIST"
  items?: ListPropertyItemsDefinition
  subtype?: wire.FieldType
  subtypeOptions?: wire.SelectOption[]
} & BaseProperty

/**
 * Signals property is a convenience wrapper around LIST
 * which will add in all necessary sub-properties to allowing editing a list of Signals
 */
type SignalsProperty = {
  type: "SIGNALS"
} & BaseProperty

type ParamsProperty = {
  type: "PARAMS"
  viewProperty?: string
  viewComponentIdProperty?: string
} & BaseProperty

type IconProperty = {
  type: "ICON"
} & BaseProperty

type DateProperty = {
  type: "DATE"
} & BaseProperty

type ComponentProperty =
  | BotProperty
  | TextProperty
  | NumberProperty
  | KeyProperty
  | MetadataProperty
  | MultiMetadataProperty
  | NamespaceProperty
  | ParamProperty
  | SelectProperty
  | ConditionProperty
  | CollectionFieldProperty
  | CollectionFieldsProperty
  | WireProperty
  | WiresProperty
  | FieldMetadataProperty
  | FieldProperty
  | FieldsProperty
  | ComponentIdProperty
  | CheckboxProperty
  | MapProperty
  | ParamsProperty
  | ListProperty
  | SignalsProperty
  | LongTextProperty
  | IconProperty
  | StructProperty
  | DateProperty
  | CollectionFieldProperty
  | CollectionFieldsProperty
  | FieldValueProperty
  | FieldValuesProperty

const getStyleVariantProperty = (componentType: string): ComponentProperty => ({
  name: component.STYLE_VARIANT,
  type: "METADATA",
  metadata: {
    type: "COMPONENTVARIANT",
    grouping: componentType || "",
  },
  label: "Variant",
})

export type {
  BotProperty,
  CollectionFieldProperty,
  ComponentProperty,
  ConditionProperty,
  ComponentPropertiesGetter,
  FieldProperty,
  FieldsProperty,
  FieldMetadataProperty,
  IconProperty,
  ListProperty,
  PropertyAction as ListPropertyAction,
  ListPropertyActionFunction,
  ListPropertyActionOptions,
  ListPropertyItemChildrenFunction,
  ListPropertyItemChildrenFunctionOptions,
  ListPropertyItemsDefinition,
  MapProperty,
  PropertyOnChange,
  SelectProperty,
  StructProperty,
  WireProperty,
  TextProperty,
  NumberProperty,
  CheckboxProperty,
  DateProperty,
  FieldValueProperty,
  FieldValuesProperty,
  MetadataProperty,
  MultiMetadataProperty,
}

export { getStyleVariantProperty }
