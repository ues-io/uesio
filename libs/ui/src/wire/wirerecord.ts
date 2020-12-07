import get from "lodash.get"
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

	getId = (): string => this.id
	getWire = (): Wire => this.wire
	getFieldValue = (fieldName: string): FieldValue =>
		get(this.source, fieldName)

	update = (fieldId: string, value: FieldValue): void => {
		this.wire.dispatchRecordUpdate(this.id, {
			[fieldId]: value,
		})
	}

	set = (fieldId: string, value: FieldValue): void => {
		this.wire.dispatchRecordSet(this.id, {
			[fieldId]: value,
		})
	}
}

export { WireRecord, PlainWireRecord, PlainWireRecordMap, FieldValue }
