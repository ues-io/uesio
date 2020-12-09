import { Dictionary } from "@reduxjs/toolkit"
import { getFullWireId } from "../bands/wire/selectors"
import { PlainWire } from "../bands/wire/types"
import { Context } from "../context/context"
import { LoadResponseRecord } from "../load/loadresponse"

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

const getDefaultRecord = (
	context: Context,
	wires: Dictionary<PlainWire>,
	viewId: string,
	wireName: string
): LoadResponseRecord => {
	const viewDef = context.getViewDef()
	if (!viewDef) return {}
	const defaults = viewDef.definition?.wires[wireName]?.defaults

	const defaultRecord: LoadResponseRecord = {}
	defaults?.forEach((defaultItem) => {
		if (defaultItem.valueSource === "LOOKUP") {
			const lookupWire =
				wires[getFullWireId(viewId, defaultItem.lookupWire)]
			if (!lookupWire) return

			const firstRecord = Object.values(lookupWire.data)[0]
			const lookupValue = defaultItem.lookupField
				? firstRecord[defaultItem.lookupField]
				: context.merge(defaultItem.lookupTemplate)
			if (lookupValue) {
				defaultRecord[defaultItem.field] = lookupValue
			}
		}
		if (defaultItem.valueSource === "VALUE") {
			const value = context.merge(defaultItem.value)
			if (value) {
				defaultRecord[defaultItem.field] = value
			}
		}
	})
	return defaultRecord
}

export { LookupDefault, ValueDefault, WireDefault, getDefaultRecord }
