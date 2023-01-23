import { Context } from "../../../context/context"
import { updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { runManyThrottled } from "../../../signals/signals"
import { dispatch } from "../../../store/store"

export default async (context: Context, path: string[], value: FieldValue) => {
	const record = context.getRecord()
	if (!record) return context
	const wire = record.getWire()
	if (!wire) return context

	dispatch(
		updateRecord({
			recordId: record.id,
			record: value,
			entity: wire.getFullId(),
			path,
		})
	)

	// Now run change events
	const changeEvents = wire.getEvents()?.onChange

	if (changeEvents) {
		for (const changeEvent of changeEvents) {
			if (changeEvent.field !== path[0]) continue
			runManyThrottled(changeEvent.signals, context)
		}
	}

	return context
}
