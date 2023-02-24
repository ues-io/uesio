import { component, definition, metadata, wire } from "@uesio/ui"

type BaseProperty = {
	name: string
	label?: string
	required?: boolean
	type: string
	displayConditions?: component.DisplayCondition[]
}
type TextProperty = {
	type: "TEXT"
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
	wire: string
	filter?: (def: wire.WireConditionState) => boolean
} & BaseProperty

type WireProperty = {
	type: "WIRE"
	filter?: (def: wire.RegularWireDefinition) => boolean
} & BaseProperty

type WiresProperty = {
	type: "WIRES"
} & BaseProperty

type FieldProperty = {
	type: "FIELD"
	wireField: string
} & BaseProperty

type FieldsProperty = {
	type: "FIELDS"
	wireField: string
} & BaseProperty

type SelectProperty = {
	type: "SELECT"
	options: SelectOption[]
	required?: boolean
	blankOptionLabel?: string
} & BaseProperty

type MapProperty = {
	type: "MAP"
	content: definition.DefinitionList
	defaultDefinition: definition.DefinitionMap
	defaultKey: string
} & BaseProperty

type ListProperty = {
	type: "LIST"
	components: definition.DefinitionList
} & BaseProperty

type ParamsProperty = {
	type: "PARAMS"
} & BaseProperty

type SelectOption = {
	value: string // TODO This should be able to be a boolean or number as well
	label: string
	disabled?: boolean
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
	| FieldProperty
	| FieldsProperty
	| ComponentIdProperty
	| CheckboxProperty
	| MapProperty
	| ParamsProperty
	| ListProperty

const getStyleVariantProperty = (componentType: string): ComponentProperty => ({
	name: "uesio.variant",
	type: "METADATA",
	metadataType: "COMPONENTVARIANT",
	label: "Variant",
	groupingValue: componentType || "",
})

export {
	BotProperty,
	ComponentProperty,
	SelectOption,
	SelectProperty,
	WireProperty,
	MapProperty,
	getStyleVariantProperty,
}
