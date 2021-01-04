import get from "lodash.get"
import Wire from "../wire/class"
import { FieldValue, PlainWireRecord } from "./types"

class WireRecord {
	constructor(source: PlainWireRecord, id: string, wire: Wire) {
		this.id = id
		this.source = source || ({} as PlainWireRecord)
		this.wire = wire
	}

	id: string
	source: PlainWireRecord
	wire: Wire

	getId = () => this.id
	getWire = () => this.wire
	getFieldValue = (fieldName: string) => get(this.source, fieldName)

	update = (fieldId: string, value: FieldValue) => {
		this.wire.dispatchRecordUpdate(this.id, {
			[fieldId]: value,
		})
	}

	set = (fieldId: string, value: FieldValue) => {
		this.wire.dispatchRecordSet(this.id, {
			[fieldId]: value,
		})
	}
}

export default WireRecord
