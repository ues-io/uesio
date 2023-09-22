import { DisplayCondition } from "../../componentexports"
import { BundleableBase } from "../../metadataexports"
import { CollectionFieldKey, CollectionKey } from "../wire/types"

type FieldMetadataMap = {
	[key: string]: FieldMetadata
}

type FieldType =
	| "AUTONUMBER"
	| "CHECKBOX"
	| "DATE"
	| "EMAIL"
	| "FILE"
	| "LIST"
	| "LONGTEXT"
	| "MAP"
	| "MULTISELECT"
	| "NUMBER"
	| "REFERENCE"
	| "REFERENCEGROUP"
	| "SELECT"
	| "STRUCT"
	| "TEXT"
	| "TIMESTAMP"
	| "USER"

type AcceptTypes = "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "ANY"

type SelectOption = {
	label: string
	value: string
	languageLabel?: string
	disabled?: boolean
	// Title is used for acccessibility, it renders as a tooltip
	// if you hover over a SelectOption for long enough
	title?: string
	validFor?: DisplayCondition[]
}

type NumberMetadata = {
	decimals: number
}

type SelectListMetadata = {
	name: string
	options: SelectOption[]
	blank_option_label?: string
	blank_option_language_label?: string
}

type FileMetadata = {
	accept: AcceptTypes
	filesource: string
}

type ReferenceMetadata = {
	collection: CollectionKey
}

type ReferenceGroupMetadata = {
	collection: CollectionKey
	field: CollectionFieldKey
}

type FieldMetadata = {
	createable: boolean
	accessible: boolean
	updateable: boolean
	type: FieldType
	label: string
	selectlist?: SelectListMetadata
	reference?: ReferenceMetadata
	referencegroup?: ReferenceGroupMetadata
	subfields?: FieldMetadataMap
	file?: FileMetadata
	subtype?: FieldType
	number?: NumberMetadata
	required?: boolean
} & BundleableBase

type prefix<T, P extends string> = {
	[K in keyof T as K extends string ? `${P}${K}` : never]: T[K]
}

type LimitedKeyOf<T, Allowed> = {
	// for all keys in T
	[K in keyof T]: T[K] extends Allowed ? K : never // if the value of this key is a primitive, keep it. Else, discard it

	// Get the union type of the remaining values.
}[keyof T]

type BasicPrimitive = string | boolean | number

type FieldMetadataPropertyPath =
	| LimitedKeyOf<FieldMetadata, BasicPrimitive | FieldType>
	| prefix<LimitedKeyOf<ReferenceMetadata, BasicPrimitive>, "reference.">
	| prefix<LimitedKeyOf<SelectListMetadata, BasicPrimitive>, "selectlist.">
	| prefix<LimitedKeyOf<NumberMetadata, BasicPrimitive>, "number.">
	| prefix<LimitedKeyOf<FileMetadata, BasicPrimitive>, "file.">

export type {
	FieldMetadata,
	FieldMetadataMap,
	FieldMetadataPropertyPath,
	SelectOption,
	SelectListMetadata,
	FieldType,
	NumberMetadata,
	ReferenceMetadata,
}
