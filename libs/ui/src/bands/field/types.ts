type FieldMetadataMap = {
	[key: string]: FieldMetadata
}

const FIELD_TYPES = [
	"NUMBER",
	"TEXT",
	"REFERENCE",
	"REFERENCEGROUP",
	"LONGTEXT",
	"SELECT",
	"CHECKBOX",
	"MULTISELECT",
	"DATE",
	"FILE",
	"MAP",
	"TIMESTAMP",
	"LIST",
	"USER",
	"EMAIL",
	"AUTONUMBER",
] as const

type FieldType = typeof FIELD_TYPES[number]

type AcceptTypes = "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "ANY"

type SelectOption = {
	label: string
	value: string
}

type NumberMetadata = {
	decimals: number
}

type SelectListMetadata = {
	name: string
	options: SelectOption[]
	blank_option_label?: string
}

type FileMetadata = {
	accept: AcceptTypes
	filecollection: string
}

type ReferenceMetadata = {
	collection: string
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
	subfields?: FieldMetadataMap
	file?: FileMetadata
	subtype?: string
	number?: NumberMetadata
}

export {
	FieldMetadata,
	FieldMetadataMap,
	SelectOption,
	FieldType,
	NumberMetadata,
	FIELD_TYPES,
}
