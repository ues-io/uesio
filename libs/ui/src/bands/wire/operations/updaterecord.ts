import { Context } from "../../../context/context"
import { updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { runManyThrottled } from "../../../signals/signals"
import { dispatch } from "../../../store/store"
import { publish } from "../../../hooks/eventapi"
import WireRecord from "../../wirerecord/class"

export default async (
	context: Context,
	path: string[],
	value: FieldValue,
	record: WireRecord
) => {
	const wire = record.getWire()
	dispatch(
		updateRecord({
			recordId: record.id,
			record: value,
			entity: wire.getFullId(),
			path,
		})
	)

	// Publish events
	publish("wire.record.updated", {
		wireId: wire.getFullId(),
		recordId: record.id,
		field: path[0],
		value,
	})

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
