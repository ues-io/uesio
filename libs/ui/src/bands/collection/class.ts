import Field from "../field/class"
import { PlainCollection } from "./types"

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
}

export default Collection
