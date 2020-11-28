import { FieldMetadataMap, Field } from "./field"

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

type PlainCollectionMap = {
	[key: string]: PlainCollection
}

class Collection {
	constructor(source: PlainCollection | null) {
		this.valid = !!source
		this.source = source || ({} as PlainCollection)
	}

	source: PlainCollection
	valid: boolean

	getId(): string {
		return this.source.name
	}

	getNamespace(): string {
		return this.source.namespace
	}

	isValid(): boolean {
		return this.valid
	}

	getField(fieldName: string | null): Field {
		const fieldMetadata =
			this.source && fieldName ? this.source.fields[fieldName] : null
		return new Field(fieldMetadata)
	}

	getIdField(): Field {
		return this.getField(this.source ? this.source.idField : null)
	}
}

export { Collection, PlainCollectionMap, PlainCollection }
