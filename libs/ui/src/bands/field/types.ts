import { DisplayCondition } from "../../componentexports"

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
	collection: string
}

type ReferenceGroupMetadata = {
	collection: string
	field: string
}

type FieldMetadata = {
	name: string
	namespace: string
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
}

export type {
	FieldMetadata,
	FieldMetadataMap,
	SelectOption,
	SelectListMetadata,
	FieldType,
	NumberMetadata,
	ReferenceMetadata,
}
