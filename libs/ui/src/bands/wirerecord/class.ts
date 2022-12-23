import get from "lodash/get"
import { ID_FIELD, UNIQUE_KEY_FIELD } from "../collection/types"
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
	getFieldValue = <T extends FieldValue>(
		fieldName: string
	): T | undefined => {
		const fieldNameParts = fieldName?.split("->")
		return get(
			this.source,
			fieldNameParts.length === 1 ? fieldName : fieldNameParts
		)
	}
	getDateValue = (fieldName: string) => {
		const value = this.getFieldValue(fieldName)
		if (!value) return undefined
		if (typeof value === "string") return new Date(value)
		if (typeof value === "number") return new Date(value * 1000)
		return undefined
	}
	getReferenceValue = (fieldName: string) => {
		const plain = this.getFieldValue<PlainWireRecord>(fieldName)
		if (!plain) return undefined
		return new WireRecord(plain, "", this.wire)
	}
	isNew = () => !this.getIdFieldValue()
	isDeleted = () => this.wire.isMarkedForDeletion(this.id)

	getIdFieldValue = () => this.getFieldValue<string>(ID_FIELD)
	getUniqueKey = () => this.getFieldValue<string>(UNIQUE_KEY_FIELD)

	getErrors = (fieldId: string) => {
		const wire = this.wire
		const errors = wire.getErrors()
		return errors?.[this.id + ":" + fieldId]
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
