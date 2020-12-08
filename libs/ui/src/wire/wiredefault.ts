import { selectWire } from "../bands/wire/selectors"
import { Context } from "../context/context"
import { LoadResponseRecord } from "../load/loadresponse"
import RuntimeState from "../store/types/runtimestate"

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
	state: RuntimeState,
	viewId: string,
	wireName: string
): LoadResponseRecord => {
	const viewDef = context.getViewDef()
	if (!viewDef) return {}
	const defaults = viewDef.definition?.wires[wireName]?.defaults

	const defaultRecord: LoadResponseRecord = {}
	defaults?.forEach((defaultItem) => {
		if (defaultItem.valueSource === "LOOKUP") {
			const lookupPlainWire = selectWire(
				state,
				defaultItem.lookupWire,
				viewId
			)
			if (!lookupPlainWire) return

			const lookupValue = defaultItem.lookupField
				? lookupPlainWire.data[0][defaultItem.lookupField]
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
