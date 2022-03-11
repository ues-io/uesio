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

type CollectionState = {
	[key: string]: {
		status: "PENDING" | "FULFILLED"
		data: PlainCollection
	}
}

type CollectionStore = {
	[key: string]: PlainCollection // CollectionState
}

type PlainCollectionMap = {
	[key: string]: PlainCollection
}

const ID_FIELD = "uesio.id"

export {
	PlainCollectionMap,
	PlainCollection,
	CollectionState,
	CollectionStore,
	ID_FIELD,
}
