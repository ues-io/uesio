type FieldMetadataMap = {
	[key: string]: FieldMetadata
}

type FieldType = "TEXT" | "REFERENCE" | "LONGTEXT" | "SELECT" | "CHECKBOX"

type SelectOption = {
	label: string
	value: string
}

type FieldMetadata = {
	name: string
	createable: boolean
	accessible: boolean
	updateable: boolean
	type: FieldType
	label: string
	options?: SelectOption[]
	foreignKeyField?: string
	referencedCollection?: string
}

class Field {
	constructor(source: FieldMetadata | null) {
		this.valid = !!source
		this.source = source || ({} as FieldMetadata)
	}

	source: FieldMetadata
	valid: boolean

	getId(): string {
		return this.source.name
	}

	isValid(): boolean {
		return this.valid
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

export { FieldMetadata, FieldMetadataMap, Field, SelectOption }
