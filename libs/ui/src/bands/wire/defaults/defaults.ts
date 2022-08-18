import { Dictionary } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { PlainWire } from "../types"
import { FieldValue, PlainWireRecord } from "../../wirerecord/types"
import { ID_FIELD, PlainCollection } from "../../collection/types"
import { WireDefinition } from "../../../definition/wire"
import { getFullWireId } from ".."
import toPath from "lodash/toPath"
import get from "lodash/get"

const LOOKUP = "LOOKUP"
const VALUE = "VALUE"

type WireDefaultBase = {
	field: string
	valueSource?: typeof VALUE | typeof LOOKUP
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

type WireDefault = ValueDefault | LookupDefault

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
	if (item.valueSource === "VALUE") {
		return context.merge(item.value)
	}
}

const getDefaultRecord = (
	context: Context,
	wires: Dictionary<PlainWire>,
	collections: Dictionary<PlainCollection>,
	viewId: string,
	wireDef: WireDefinition,
	collectionName: string
): PlainWireRecord => {
	const collection = collections[collectionName]
	const defaults = wireDef.defaults
	const defaultRecord: PlainWireRecord = {}
	defaults?.forEach((defaultItem) => {
		const value = getDefaultValue(context, wires, viewId, defaultItem)
		const fieldMetadata = collection?.fields[defaultItem.field]
		if (value && fieldMetadata) {
			if (
				fieldMetadata.type === "REFERENCE" &&
				fieldMetadata.reference?.collection
			) {
				defaultRecord[defaultItem.field] = {
					[ID_FIELD]: value,
				}
				return
			}
			defaultRecord[defaultItem.field] = value
		}
	})
	return defaultRecord
}

export { LookupDefault, ValueDefault, WireDefault, getDefaultRecord }
