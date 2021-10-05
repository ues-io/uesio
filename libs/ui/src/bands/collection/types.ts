import { FieldMetadataMap } from "../field/types"

type PlainCollection = {
	name: string
	namespace: string
	idField: string
	nameField: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	deleteable: boolean
	fields: FieldMetadataMap
}

type CollectionState = {
	[key: string]: {
		status: "PENDING" | "FULFILLED"
		data: PlainCollection
	}
}

type PlainCollectionMap = {
	[key: string]: PlainCollection
}

export { PlainCollectionMap, PlainCollection, CollectionState }
