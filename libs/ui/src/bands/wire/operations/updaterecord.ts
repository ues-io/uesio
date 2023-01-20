import { Context, getWire } from "../../../context/context"
import { getFullWireId, updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { runManyThrottled } from "../../../signals/signals"
import { dispatch } from "../../../store/store"

export default async (context: Context, path: string[], value: FieldValue) => {
	const recordFrame = context.findRecordFrame()
	if (!recordFrame) return context
	const { view, wire, record } = recordFrame
	if (!view || !record || !wire) return context
	const actualWire = getWire(view, wire)
	if (!wire) return context

	dispatch(
		updateRecord({
			recordId: record,
			record: value,
			entity: getFullWireId(view, wire),
			path,
		})
	)

	// Now run change events
	const changeEvents = actualWire?.events?.onChange

	if (changeEvents) {
		for (const changeEvent of changeEvents) {
			if (changeEvent.field !== path[0]) continue
			runManyThrottled(changeEvent.signals, context)
		}
	}

	return context
}
