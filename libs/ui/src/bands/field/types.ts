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
	| "IMAGE"
	| "FILE"
	| "MAP"
	| "TIMESTAMP"
	| "LIST"

type SelectOption = {
	label: string
	value: string
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
	foreignKeyField?: string
	referencedCollection?: string
}

export { FieldMetadata, FieldMetadataMap, SelectOption, FieldType }
