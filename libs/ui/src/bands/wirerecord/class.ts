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
	getFieldValue = <T extends FieldValue>(fieldName: string): T => {
		const fieldNameParts = fieldName?.split("->")
		return get(
			this.source,
			fieldNameParts.length === 1 ? fieldName : fieldNameParts
		)
	}
	isNew = () => !this.getIdFieldValue()
	isDeleted = () => this.wire.isMarkedForDeletion(this.id)

	getIdFieldValue = () => {
		const metadata = this.wire.collection
		const idField = metadata.getIdField()
		return idField && this.getFieldValue(idField.getId())
	}

	update = (fieldId: string, value: FieldValue) => {
		const fieldNameParts = fieldId?.split("->")
		return this.wire.updateRecord(this.id, value, fieldNameParts)
	}

	set = (fieldId: string, value: FieldValue) => {
		const fieldNameParts = fieldId?.split("->")
		return this.wire.setRecord(this.id, value, fieldNameParts)
	}
}

export default WireRecord
