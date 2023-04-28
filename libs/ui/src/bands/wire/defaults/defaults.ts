import { Dictionary } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { PlainWire } from "../types"
import { FieldValue, PlainWireRecord } from "../../wirerecord/types"
import { ID_FIELD, PlainCollection } from "../../collection/types"
import { getFullWireId } from ".."
import toPath from "lodash/toPath"
import get from "lodash/get"
import Collection from "../../collection/class"
import set from "lodash/set"

const LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const PARAM = "PARAM"

type WireDefaultBase = {
	field: string
	valueSource?: typeof VALUE | typeof LOOKUP | typeof PARAM
}

type LookupDefault = WireDefaultBase & {
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField?: string
}

type ValueDefault = WireDefaultBase & {
	valueSource: typeof VALUE
	value: string
}
type ParamDefault = WireDefaultBase & {
	valueSource: typeof PARAM
	param: string
}

type WireDefault = ValueDefault | LookupDefault | ParamDefault

const getDefaultValue = (
	context: Context,
	wires: Dictionary<PlainWire>,
	viewId: string,
	item: WireDefault
): FieldValue => {
	if (item.valueSource === "LOOKUP") {
		const lookupWire = wires[getFullWireId(viewId, item.lookupWire)]
		if (!lookupWire) return

		const firstRecord = Object.values(lookupWire.data)[0]
		if (!firstRecord || !item.lookupField) return

		const path = toPath(item.lookupField.split("->"))
		return get(firstRecord, path)
	}
	// TODO: Default to VALUE if nothing provided?
	if (item.valueSource === "VALUE") {
		return context.merge(item.value)
	}

	if (item.valueSource === "PARAM") {
		return context.getParam(item.param)
	}
}

const getDefaultRecord = (
	context: Context,
	wires: Dictionary<PlainWire>,
	collections: Dictionary<PlainCollection>,
	wire: PlainWire
): PlainWireRecord => {
	const plainCollection = collections[wire.collection]
	if (!plainCollection)
		throw new Error(
			"No metadata for collection in default: " + wire.collection
		)

	const collection = new Collection(plainCollection)

	const defaultRecord: PlainWireRecord = {}
	const viewId = context.getViewId()
	if (!viewId) throw new Error("No view id found for defaults")
	wire?.defaults?.forEach((defaultItem) => {
		const value = getDefaultValue(context, wires, viewId, defaultItem)
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
