import Field from "../field/class"
import { PlainCollection } from "./types"

class Collection {
	constructor(source: PlainCollection | null) {
		this.valid = !!source
		this.source = source || ({} as PlainCollection)
	}

	source: PlainCollection
	valid: boolean

	getId = (): string => this.source.name
	getNamespace = (): string => this.source.namespace
	isValid = (): boolean => this.valid
	getField = (fieldName: string | null): Field => {
		const fieldMetadata =
			this.source && fieldName ? this.source.fields[fieldName] : null
		return new Field(fieldMetadata)
	}
	getIdField = (): Field =>
		this.getField(this.source ? this.source.idField : null)
}

export default Collection
