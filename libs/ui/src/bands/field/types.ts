type FieldMetadataMap = {
	[key: string]: FieldMetadata
}

type FieldType =
	| "NUMBER"
	| "TEXT"
	| "REFERENCE"
	| "LONGTEXT"
	| "SELECT"
	| "CHECKBOX"
	| "DATE"
	| "FILE"
	| "MAP"
	| "TIMESTAMP"
	| "LIST"
	| "USER"

type AcceptTypes = "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "ANY"

type SelectOption = {
	label: string
	value: string
}

type SubField = {
	name: string
}

type FieldMetadata = {
	name: string
	namespace: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	type: FieldType
	label: string
	options?: SelectOption[]
	referencedCollection?: string
	subfields?: SubField[]
	accept?: AcceptTypes
	subtype?: string
}

export { FieldMetadata, FieldMetadataMap, SelectOption, FieldType, SubField }
