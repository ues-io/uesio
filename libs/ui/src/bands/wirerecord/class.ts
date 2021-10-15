import get from "lodash/get"
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
	getFieldValue = <T extends FieldValue>(fieldName: string): T =>
		get(this.source, fieldName) as T
	isNew = () => !this.getIdFieldValue()
	isDeleted = () => this.wire.isMarkedForDeletion(this.id)

	getIdFieldValue = () => {
		const metadata = this.wire.collection
		const idField = metadata.getIdField()
		return idField && this.getFieldValue(idField.getId())
	}

	update = (fieldId: string, value: FieldValue) =>
		this.wire.updateRecord(this.id, {
			[fieldId]: value,
		})

	set = (fieldId: string, value: FieldValue) => {
		this.wire.setRecord(this.id, {
			[fieldId]: value,
		})
	}
}

export default WireRecord
