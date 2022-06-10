import { FieldMetadataMap } from "../field/types"

type PlainCollection = {
	name: string
	namespace: string
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

const ID_FIELD = "uesio/core.id"

export { PlainCollectionMap, PlainCollection, ID_FIELD }
