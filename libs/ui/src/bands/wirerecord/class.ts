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
		if (fieldNameParts.length === 1) {
			return this.wire.updateRecord(this.id, {
				[fieldId]: value,
			})
		}
		// Special handling for maps
		const topField = fieldNameParts.pop()
		if (!topField) return
		return this.wire.updateRecord(
			this.id,
			{
				[topField]: value,
			},
			fieldNameParts
		)
	}

	set = (fieldId: string, value: FieldValue) => {
		const fieldNameParts = fieldId?.split("->")
		if (fieldNameParts.length === 1) {
			this.wire.setRecord(this.id, {
				[fieldId]: value,
			})
		}
		// Special handling for maps
		const topField = fieldNameParts.pop()
		if (!topField) return
		return this.wire.setRecord(
			this.id,
			{
				[topField]: value,
			},
			fieldNameParts
		)
	}
}

export default WireRecord
