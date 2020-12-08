import Field from "../field/class"
import { PlainCollection } from "./types"

class Collection {
	constructor(source: PlainCollection) {
		this.source = source
	}

	source: PlainCollection

	getId(): string {
		return this.source.name
	}

	getNamespace(): string {
		return this.source.namespace
	}

	getField(fieldName: string | null): Field | undefined {
		const fieldMetadata =
			this.source && fieldName ? this.source.fields[fieldName] : null
		if (!fieldMetadata) return undefined
		return new Field(fieldMetadata)
	}

	getIdField(): Field | undefined {
		return this.getField(this.source ? this.source.idField : null)
	}
}

export default Collection
