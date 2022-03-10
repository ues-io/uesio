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
			return this.wire.updateRecord(this.id, value, fieldNameParts)
		}

		// Special handling for maps
		const mapFieldId = fieldNameParts.shift()
		const chosenField = fieldNameParts.pop()

		if (!chosenField || !mapFieldId) return

		const mapUpdatedValue = {
			...this.getFieldValue<PlainWireRecord>(mapFieldId),
			[chosenField]: value,
		}
		return this.wire.updateRecord(this.id, mapUpdatedValue, [mapFieldId])
	}

	set = (fieldId: string, value: FieldValue) => {
		const fieldNameParts = fieldId?.split("->")
		if (fieldNameParts.length === 1) {
			return this.wire.setRecord(this.id, value, fieldNameParts)
		}

		// Special handling for maps
		const mapFieldId = fieldNameParts.shift()
		const chosenField = fieldNameParts.pop()

		if (!chosenField || !mapFieldId) return

		const mapUpdatedValue = {
			...this.getFieldValue<PlainWireRecord>(mapFieldId),
			[chosenField]: value,
		}
		return this.wire.setRecord(this.id, mapUpdatedValue, [mapFieldId])
	}
}

export default WireRecord
