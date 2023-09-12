import { nanoid } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { FieldValue, PlainWireRecord } from "../../wirerecord/types"
import { ID_FIELD } from "../../collection/types"
import toPath from "lodash/toPath"
import get from "lodash/get"
import set from "lodash/set"
import Wire from "../class"

const LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const PARAM = "PARAM"
const SHORTID = "SHORTID"

type WireDefaultBase = {
	field: string
	valueSource?: typeof VALUE | typeof LOOKUP | typeof PARAM | typeof SHORTID
}

type ShortIDDefault = WireDefaultBase & {
	valueSource: typeof SHORTID
}

type LookupDefault = WireDefaultBase & {
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField?: string
}

type ValueDefault = WireDefaultBase & {
	valueSource: typeof VALUE
	value: string | boolean | number
}
type ParamDefault = WireDefaultBase & {
	valueSource: typeof PARAM
	param: string
}

type WireDefault = ValueDefault | LookupDefault | ParamDefault | ShortIDDefault

const getDefaultValue = (context: Context, item: WireDefault): FieldValue => {
	if (item.valueSource === "LOOKUP") {
		const lookupWire = context.getWire(item.lookupWire)
		if (!lookupWire) return

		const firstRecord = lookupWire.getFirstRecord()
		if (!firstRecord || !item.lookupField) return

		const path = toPath(item.lookupField.split("->"))
		return get(firstRecord.getPlainData(), path)
	}
	// TODO: Default to VALUE if nothing provided?
	if (item.valueSource === "VALUE") {
		return context.merge(item.value)
	}

	if (item.valueSource === "SHORTID") {
		return nanoid()
	}

	if (item.valueSource === "PARAM") {
		return context.getParam(item.param)
	}
}

const getDefaultRecord = (context: Context, wire: Wire): PlainWireRecord => {
	const collection = wire.getCollection()
	const defaultRecord: PlainWireRecord = {}
	wire.getDefaults().forEach((defaultItem) => {
		const value = getDefaultValue(context, defaultItem)
		const fieldName = defaultItem.field
		const field = collection.getField(fieldName)
		if (!field)
			throw new Error("No metadata for field in default: " + fieldName)

		const fieldNameParts = fieldName?.split("->")

		if (field.isReference()) fieldNameParts.push(ID_FIELD)
		if (field.isReference() && !value) return

		set(defaultRecord, fieldNameParts, value)
	})
	return defaultRecord
}

export type { LookupDefault, ValueDefault, WireDefault }
export { getDefaultRecord }
