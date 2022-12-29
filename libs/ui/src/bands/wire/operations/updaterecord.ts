import { Context, getWire } from "../../../context/context"
import { getFullWireId, updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { runManyThrottled } from "../../../signals/signals"
import { dispatch } from "../../../store/store"

export default async (context: Context, path: string[], value: FieldValue) => {
	const viewId = context.getViewId()
	if (!viewId) return context
	const recordId = context.getRecordId()
	if (!recordId) return context
	const wireId = context.getWireId()
	if (!wireId) return context
	const wire = getWire(viewId, wireId)
	if (!wire) return context

	dispatch(
		updateRecord({
			recordId,
			record: value,
			entity: getFullWireId(viewId, wireId),
			path,
		})
	)

	// Now run change events
	const changeEvents = wire?.events?.onChange

	if (changeEvents) {
		for (const changeEvent of changeEvents) {
			if (changeEvent.field !== path[0]) continue
			runManyThrottled(changeEvent.signals, context)
		}
	}

	return context
}
