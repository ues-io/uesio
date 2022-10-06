import { platform } from "../../src/platform/platform"
import { create } from "../../src/store/store"
import { FieldMetadataMap } from "../../src/bands/field/types"
import { PlainCollection } from "../../src/bands/collection/types"

const COLLECTION_NAME = "exoplanet"
const NS = "ben/planets"
const wireId = "exoplanets"
const viewId = "allplanets"

export const testEnv = {
	collectionId: COLLECTION_NAME,
	ns: NS,
	viewId,
	wireId,
}

export const getStore = () => create(platform, {})

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
})
