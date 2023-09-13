import get from "lodash/get"
import { Context } from "../../context/context"
import { ID_FIELD, UNIQUE_KEY_FIELD } from "../collection/types"
import Wire from "../wire/class"
import { FieldValue, PlainWireRecord } from "./types"
import updateRecordOp from "../wire/operations/updaterecord"
import { getFullyQualifiedKey } from "../../component/path"

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
	getPlainData = () => this.source
	getCollection = () => this.wire?.getCollection()
	getFieldValue = <T extends FieldValue>(
		fieldName: string
	): T | undefined => {
		const ns = this.getCollection()?.getNamespace()
		const parts = fieldName?.split("->")
		return get(
			this.source,
			parts.length === 1
				? getFullyQualifiedKey(fieldName, ns)
				: parts.map((part) => getFullyQualifiedKey(part, ns))
		)
	}
	getDateValue = (fieldName: string) => {
		const value = this.getFieldValue(fieldName)
		if (!value) return undefined
		// Dates are stored as strings
		if (typeof value === "string") return new Date(value)
		// Datetimes are store as numbers (seconds from epoch)
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

	update = (fieldId: string, value: FieldValue, context: Context) => {
		const fieldNameParts = fieldId?.split("->")
		updateRecordOp(context, fieldNameParts, value, this)
	}

	set = (fieldId: string, value: FieldValue) => {
		const fieldNameParts = fieldId?.split("->")
		return this.wire.setRecord(this.id, value, fieldNameParts)
	}

	setAll = (value: PlainWireRecord) => this.wire.setRecord(this.id, value, [])
}

export default WireRecord
