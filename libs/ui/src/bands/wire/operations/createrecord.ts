import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AnyAction } from "redux"
import RuntimeState from "../../../store/types/runtimestate"
import { LoadResponseRecord } from "../../../load/loadresponse"
import shortid from "shortid"
import { createRecord } from ".."
import { selectWire } from "../selectors"
import { Wire } from "../../../wire/wire"

export default (context: Context, wirename: string) => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState
) => {
	const viewId = context.getViewId()
	const viewDef = context.getViewDef()
	if (!viewId || !viewDef || !viewDef.definition) return context

	const state = getState()
	const plainWire = selectWire(state, wirename, viewId)
	if (!plainWire) return context
	const wireDef = viewDef.definition.wires[wirename]
	const defaults = wireDef.defaults
	const defaultRecord: LoadResponseRecord = {}
	defaults?.forEach((defaultItem) => {
		if (defaultItem.valueSource === "LOOKUP") {
			const lookupPlainWire = selectWire(
				state,
				defaultItem.lookupWire,
				viewId
			)
			if (!lookupPlainWire) return
			const lookupWire = new Wire(lookupPlainWire)
			const lookupValue = defaultItem.lookupField
				? lookupWire
						.getFirstRecord()
						.getFieldValue(defaultItem.lookupField)
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
	const recordId = shortid.generate()
	dispatch(
		createRecord({
			recordId,
			record: defaultRecord,
			entity: `${viewId}/${wirename}`,
		})
	)

	return context.addFrame({
		record: recordId,
		wire: wirename,
	})
}
