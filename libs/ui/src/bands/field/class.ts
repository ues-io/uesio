import { FieldMetadata, FieldType, SelectOption } from "./types"

class Field {
	constructor(source: FieldMetadata) {
		this.source = source
	}

	source: FieldMetadata

	getId() {
		return this.source.namespace + "." + this.source.name
	}

	getLabel(): string {
		return this.source.label
	}

	getType(): FieldType {
		return this.source.type
	}

	getCreateable(): boolean {
		return this.source.createable
	}

	getUpdateable(): boolean {
		return this.source.updateable
	}

	getAccessible(): boolean {
		return this.source.accessible
	}

	getOptions(): SelectOption[] | null {
		return this.source.options || null
	}
}

export default Field
