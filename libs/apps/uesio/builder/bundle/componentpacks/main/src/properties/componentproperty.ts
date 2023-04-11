import { component, definition, metadata, wire } from "@uesio/ui"
import { PropertiesPanelSection } from "../api/propertysection"

type BaseProperty = {
	name: string
	label?: string
	required?: boolean
	type: string
	placeholder?: string
	readonly?: boolean
	display?: boolean
	displayConditions?: component.DisplayCondition[]
}
type TextProperty = {
	type: "TEXT"
} & BaseProperty

type TextAreaProperty = {
	type: "TEXT_AREA"
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

type MetadataProperty = {
	type: "METADATA"
	metadataType: metadata.MetadataType
	groupingPath?: string
	groupingValue?: string
} & BaseProperty

type MultiMetadataProperty = {
	type: "MULTI_METADATA"
	metadataType: metadata.MetadataType
	groupingPath?: string
	groupingValue?: string
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
} & BaseProperty

type WiresProperty = {
	type: "WIRES"
} & BaseProperty

type FieldPropertyBase = {
	wireField?: string
	wireName?: string
} & BaseProperty

type FieldMetadataProperty = {
	type: "FIELD_METADATA"
	fieldProperty: string
	wireProperty: string
	metadataProperty: "type" // TODO: Add more properties here, e.g. referenceType, etc.
} & BaseProperty

type FieldProperty = {
	type: "FIELD"
} & FieldPropertyBase
type FieldsProperty = {
	type: "FIELDS"
} & FieldPropertyBase

type SelectProperty = {
	type: "SELECT"
	options: SelectOption[] | ((record: wire.PlainWireRecord) => SelectOption[])
	required?: boolean
	blankOptionLabel?: string
} & BaseProperty

type MapProperty = {
	type: "MAP"
	content: definition.DefinitionList
	defaultDefinition: definition.DefinitionMap
	defaultKey: string
} & BaseProperty

type ComponentPropertiesGetter = (
	record: wire.PlainWireRecord
) => ComponentProperty[]

type DisplayTemplateGetter = (record: wire.PlainWireRecord) => string

interface ListPropertyItemsDefinition {
	properties: ComponentProperty[] | ComponentPropertiesGetter
	addLabel: string
	displayTemplate: string | DisplayTemplateGetter
	title?: string
	defaultDefinition?: definition.DefinitionMap
	sections?: PropertiesPanelSection[]
}

type ListProperty = {
	type: "LIST"
	components?: definition.DefinitionList
	items?: ListPropertyItemsDefinition
} & BaseProperty

type ParamsProperty = {
	type: "PARAMS"
} & BaseProperty

type IconProperty = {
	type: "ICON"
} & BaseProperty

type SelectOption = {
	value: string // TODO This should be able to be a boolean or number as well
	label: string
	disabled?: boolean
	metadata?: SelectOptionMetadata
}
// Extra metadata for special circumstances, such as FIELD properties
// where we want to store the display type of the field
type SelectOptionMetadata = {
	displayType?: string
}

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
	| TextAreaProperty
	| IconProperty

const getStyleVariantProperty = (componentType: string): ComponentProperty => ({
	name: "uesio.variant",
	type: "METADATA",
	metadataType: "COMPONENTVARIANT",
	label: "Variant",
	groupingValue: componentType || "",
})

export type {
	BotProperty,
	ListPropertyItemsDefinition,
	ComponentProperty,
	SelectOption,
	SelectOptionMetadata,
	SelectProperty,
	WireProperty,
	MapProperty,
	ListProperty,
	IconProperty,
}

export { getStyleVariantProperty }
