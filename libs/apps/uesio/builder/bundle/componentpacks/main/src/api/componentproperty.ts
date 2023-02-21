import { definition, metadata, component } from "@uesio/ui"

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

type ComponentIdProperty = {
	type: "COMPONENT_ID"
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

type CheckboxProperty = {
	type: "CHECKBOX"
} & BaseProperty

type WireProperty = {
	type: "WIRE"
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
	| TextProperty
	| NumberProperty
	| KeyProperty
	| MetadataProperty
	| MultiMetadataProperty
	| SelectProperty
	| WireProperty
	| FieldProperty
	| FieldsProperty
	| ComponentIdProperty
	| CheckboxProperty
	| MapProperty
	| ParamsProperty

const getStyleVariantProperty = (componentType: string): ComponentProperty => ({
	name: "uesio.variant",
	type: "METADATA",
	metadataType: "COMPONENTVARIANT",
	label: "Variant",
	groupingValue: componentType || "",
})

export {
	ComponentProperty,
	SelectOption,
	SelectProperty,
	WireProperty,
	getStyleVariantProperty,
}
