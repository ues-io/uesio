import { Wire } from "./wire"

type FieldValue = string | number | boolean | undefined | null | PlainWireRecord

type PlainWireRecord = {
	[key: string]: FieldValue
}

type PlainWireRecordMap = {
	[key: string]: PlainWireRecord
}

class WireRecord {
	constructor(source: PlainWireRecord, id: string, wire: Wire) {
		this.id = id
		this.valid = !!source
		this.source = source || ({} as PlainWireRecord)
		this.wire = wire
	}

	id: string
	source: PlainWireRecord
	valid: boolean
	wire: Wire

	getId(): string {
		return this.id
	}

	getFieldValue(fieldName: string): FieldValue {
		return this.source[fieldName]
	}

	update(fieldId: string, value: FieldValue): void {
		this.wire.dispatchRecordUpdate(this.id, {
			[fieldId]: value,
		})
	}
}

export { WireRecord, PlainWireRecord, PlainWireRecordMap, FieldValue }
