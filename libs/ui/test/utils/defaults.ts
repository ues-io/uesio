import { create } from "../../src/store/store"
import { FieldMetadataMap } from "../../src/bands/field/types"
import { PlainCollection } from "../../src/bands/collection/types"

const COLLECTION_NAME = "exoplanet"
const COLLECTION_LABEL = "Exoplanet"
const COLLECTION_LABEL_PLURAL = "Exoplanets"
const NS = "ben/planets" as `${string}/${string}`
const wireId = "exoplanets"
const viewId = "allplanets"

export const testEnv = {
	collectionId: COLLECTION_NAME,
	ns: NS,
	viewId,
	wireId,
}

export const getStore = () => create({})

export const getFields = (): FieldMetadataMap => ({
	"ben/planets.name": {
		name: "name",
		namespace: NS,
		createable: true,
		accessible: true,
		updateable: true,
		type: "TEXT",
		label: "Name",
	},
})

export const getCollection = (): PlainCollection => ({
	name: COLLECTION_NAME,
	namespace: NS,
	createable: true,
	accessible: true,
	updateable: true,
	deleteable: true,
	nameField: `${NS}.name`,
	fields: getFields(),
	label: COLLECTION_LABEL,
	pluralLabel: COLLECTION_LABEL_PLURAL,
})
