import { BundleableBase } from "../../metadataexports"
import { FieldMetadataMap } from "../field/types"

export type PlainCollection = {
	nameField: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	deleteable: boolean
	fields: FieldMetadataMap
	hasAllFields?: boolean
	label: string
	pluralLabel: string
	uniqueKey?: string[]
	icon?: string
} & BundleableBase

export type PlainCollectionMap = Record<string, PlainCollection>

const ID_FIELD = "uesio/core.id"
const UNIQUE_KEY_FIELD = "uesio/core.uniquekey"
const UPDATED_AT_FIELD = "uesio/core.updatedat"
const CREATED_AT_FIELD = "uesio/core.createdat"
const UPDATED_BY_FIELD = "uesio/core.updatedby"
const CREATED_BY_FIELD = "uesio/core.createdby"
const OWNER_FIELD = "uesio/core.owner"
const COLLECTION_FIELD = "uesio/core.collection"

export {
	ID_FIELD,
	UNIQUE_KEY_FIELD,
	OWNER_FIELD,
	UPDATED_AT_FIELD,
	UPDATED_BY_FIELD,
	CREATED_AT_FIELD,
	CREATED_BY_FIELD,
	COLLECTION_FIELD,
}
