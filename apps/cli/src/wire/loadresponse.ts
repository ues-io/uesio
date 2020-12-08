type FieldMetadataMap = {
	[key: string]: FieldMetadata
}

type FieldType = "TEXT" | "REFERENCE" | "LONGTEXT"

type FieldMetadata = {
	name: string
	namespace: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	type: FieldType
	label: string
}

type PlainCollection = {
	name: string
	idField: string
	nameField: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	deleteable: boolean
	fields: FieldMetadataMap
}

type PlainCollectionMap = {
	[key: string]: PlainCollection
}

type LoadResponse = {
	wire: string
	collection: string
	data: LoadResponseRecord[]
}

type LoadResponseRecord = {
	[key: string]: FieldValue
}

type FieldValue = string | number | boolean | undefined
type KeyValue = string | number

type LoadResponseBatch = {
	wires: LoadResponse[]
	collections: PlainCollectionMap
}

export {
	LoadResponse,
	LoadResponseBatch,
	LoadResponseRecord,
	FieldValue,
	KeyValue,
	PlainCollectionMap,
}
