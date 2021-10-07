import { getStore } from "../../store/store"
import Field from "../field/class"
import { PlainCollection } from "./types"
import { selectors as collectionSelectors } from "./adapter"

class Collection {
	constructor(source: PlainCollection) {
		this.source = source
	}

	source: PlainCollection

	getId = () => this.source.name
	getNamespace = () => this.source.namespace
	getFullName = () => this.getNamespace() + "." + this.getId()
	getField = (fieldName: string | null) => {
		const fieldMetadata = fieldName ? this.source.fields[fieldName] : null
		if (!fieldMetadata) return undefined
		return new Field(fieldMetadata)
	}

	getIdField = () => this.getField(this.source.idField)
	getNameField = () => this.getField(this.source.nameField)
	getRefCollection = (refCollectionName: string) => {
		const state = getStore().getState()
		const plainCollection = collectionSelectors.selectById(
			state,
			refCollectionName
		)
		if (!plainCollection) return undefined
		const collection = new Collection(plainCollection)
		return collection
	}
}

export default Collection
