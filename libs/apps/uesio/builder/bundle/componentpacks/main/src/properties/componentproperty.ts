import { component, context, definition, metadata, wire } from "@uesio/ui"
import { PropertiesPanelSection } from "../api/propertysection"

type FieldUpdate = {
	field: string
	// If value is undefined, then the field's value will be cleared from YAML definition.
	value?: wire.PlainFieldValue
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
	placeholder?: string
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
	defaultToContext?: boolean
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
	metadataProperty: "type" // TODO: Add more properties here, e.g. referenceType, etc.
	wireProperty?: string
	wireName?: string
} & BaseProperty

type FieldProperty = {
	type: "FIELD"
} & FieldPropertyBase
type FieldsProperty = {
	type: "FIELDS"
} & FieldPropertyBase

type SelectProperty = {
	type: "SELECT"
	options:
		| wire.SelectOption[]
		| ((record: wire.PlainWireRecord) => wire.SelectOption[])
	required?: boolean
	blankOptionLabel?: string
} & BaseProperty

type MapProperty = {
	type: "MAP"
	content: definition.DefinitionList
	defaultDefinition: definition.DefinitionMap
	defaultKey: string
} & BaseProperty

type StructProperty = {
	type: "STRUCT"
	properties: ComponentProperty[]
} & BaseProperty

type ComponentPropertiesGetter = (
	record: wire.PlainWireRecord,
	context: context.Context
) => ComponentProperty[]

type DisplayTemplateGetter = (record: wire.PlainWireRecord) => string

interface ListPropertyItemsDefinition {
	addLabel?: string
	defaultDefinition?: definition.DefinitionMap
	displayTemplate?: string | DisplayTemplateGetter
	properties?: ComponentProperty[] | ComponentPropertiesGetter
	sections?: PropertiesPanelSection[]
	title?: string
}

type ListProperty = {
	type: "LIST"
	items?: ListPropertyItemsDefinition
	subtype?: wire.FieldType
	subtypeOptions?: wire.SelectOption[]
} & BaseProperty

type ParamsProperty = {
	type: "PARAMS"
	viewProperty?: string
	viewComponentIdProperty?: string
} & BaseProperty

type IconProperty = {
	type: "ICON"
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
	| StructProperty

const getStyleVariantProperty = (componentType: string): ComponentProperty => ({
	name: "uesio.variant",
	type: "METADATA",
	metadataType: "COMPONENTVARIANT",
	label: "Variant",
	groupingValue: componentType || "",
})

export type {
	BotProperty,
	ComponentProperty,
	FieldProperty,
	FieldMetadataProperty,
	IconProperty,
	ListProperty,
	ListPropertyItemsDefinition,
	MapProperty,
	PropertyOnChange,
	SelectProperty,
	StructProperty,
	WireProperty,
}

export { getStyleVariantProperty }
