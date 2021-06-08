import { Dictionary } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { PlainWire } from "../types"
import { getFullWireId } from "../selectors"
import { FieldValue, PlainWireRecord } from "../../wirerecord/types"
import { PlainCollectionMap } from "../../collection/types"

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
	lookupTemplate?: string
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
		if (!firstRecord) return

		return item.lookupField
			? firstRecord[item.lookupField]
			: context.merge(item.lookupTemplate)
	}
	if (item.valueSource === "VALUE") {
		return context.merge(item.value)
	}
}

const getDefaultRecord = (
	context: Context,
	wires: Dictionary<PlainWire>,
	collections: PlainCollectionMap,
	viewId: string,
	wireName: string
): PlainWireRecord => {
	const viewDef = context.getViewDef()
	if (!viewDef) return {}
	const wire = viewDef.definition?.wires[wireName]
	if (!wire) return {}
	const defaults = wire.defaults
	const collection = collections[wire.collection]
	const defaultRecord: PlainWireRecord = {}
	defaults?.forEach((defaultItem) => {
		const value = getDefaultValue(context, wires, viewId, defaultItem)
		const fieldMetadata = collection.fields[defaultItem.field]
		if (value && fieldMetadata) {
			if (
				fieldMetadata.type === "REFERENCE" &&
				fieldMetadata.referencedCollection
			) {
				const referenceMeta =
					collections[fieldMetadata.referencedCollection]
				defaultRecord[defaultItem.field] = {
					[referenceMeta.idField]: value,
				}
				return
			}
			defaultRecord[defaultItem.field] = value
		}
	})
	return defaultRecord
}

export { LookupDefault, ValueDefault, WireDefault, getDefaultRecord }
