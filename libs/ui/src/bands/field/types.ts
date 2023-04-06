type FieldMetadataMap = {
	[key: string]: FieldMetadata
}

type FieldType =
	| "NUMBER"
	| "TEXT"
	| "REFERENCE"
	| "REFERENCEGROUP"
	| "LONGTEXT"
	| "SELECT"
	| "CHECKBOX"
	| "MULTISELECT"
	| "DATE"
	| "FILE"
	| "MAP"
	| "TIMESTAMP"
	| "LIST"
	| "USER"
	| "EMAIL"
	| "AUTONUMBER"

type AcceptTypes = "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "ANY"

type SelectOption = {
	label: string
	value: string
	languageLabel?: string
	disabled?: boolean
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
	subtype?: string
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
