import get from "lodash/get"
import { ID_FIELD, UNIQUE_KEY_FIELD } from "../collection/types"
import Wire from "../wire/class"
import { getFieldPath } from "../utils"
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
		const { pathArray } = getFieldPath(fieldName)
		return get(this.source, pathArray.length === 1 ? fieldName : pathArray)
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
		const { pathArray } = getFieldPath(fieldId)
		return this.wire.updateRecord(this.id, value, pathArray)
	}

	set = (fieldId: string, value: FieldValue) => {
		const { pathArray } = getFieldPath(fieldId)
		return this.wire.setRecord(this.id, value, pathArray)
	}
}

export default WireRecord
