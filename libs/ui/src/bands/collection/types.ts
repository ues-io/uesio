import { FieldMetadataMap } from "../field/types"

export type PlainCollection = {
	name: string
	namespace: string
	nameField: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	deleteable: boolean
	fields: FieldMetadataMap
	hasAllFields?: boolean
	label: string
	pluralLabel: string
}

export type PlainCollectionMap = {
	[key: string]: PlainCollection
}

const ID_FIELD = "uesio/core.id"
const UNIQUE_KEY_FIELD = "uesio/core.uniquekey"
const UPDATED_AT_FIELD = "uesio/core.updatedat"

export { ID_FIELD, UNIQUE_KEY_FIELD, UPDATED_AT_FIELD }
