type PlainWireField = {
	id: string
	fields?: PlainWireFieldMap
}

type PlainWireFieldMap = {
	[key: string]: PlainWireField
}

class WireField {
	constructor(source: PlainWireField, id: string) {
		this.id = id
		this.valid = !!source
		this.source = source || ({} as PlainWireField)
	}

	id: string
	source: PlainWireField
	valid: boolean

	getId(): string {
		return this.id
	}
}

export { WireField, PlainWireFieldMap }
