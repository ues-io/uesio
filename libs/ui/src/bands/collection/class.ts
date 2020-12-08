import Field from "../field/class"
import { PlainCollection } from "./types"

class Collection {
	constructor(source: PlainCollection) {
		this.source = source
	}

	source: PlainCollection

	getId = () => this.source.name
	getNamespace = () => this.source.namespace
	getField = (fieldName: string | null) => {
		const fieldMetadata =
			this.source && fieldName ? this.source.fields[fieldName] : null
		if (!fieldMetadata) return undefined
		return new Field(fieldMetadata)
	}

	getIdField = () => this.getField(this.source ? this.source.idField : null)
}

export default Collection
