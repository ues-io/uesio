import { FieldMetadata, FieldType, SelectOption } from "./types"

class Field {
	constructor(source: FieldMetadata | null) {
		this.valid = !!source
		this.source = source || ({} as FieldMetadata)
	}

	source: FieldMetadata
	valid: boolean

	getId = (): string => this.source.name
	isValid = (): boolean => this.valid
	getLabel = (): string => this.source.label
	getType = (): FieldType => this.source.type
	getCreateable = (): boolean => this.source.createable
	getUpdateable = (): boolean => this.source.updateable
	getAccessible = (): boolean => this.source.accessible
	getOptions = (): SelectOption[] | null => this.source.options || null
}

export default Field
