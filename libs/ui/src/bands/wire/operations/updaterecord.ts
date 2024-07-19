import { Context } from "../../../context/context"
import { updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { dispatch } from "../../../store/store"
import { publish } from "../../../hooks/eventapi"
import WireRecord from "../../wirerecord/class"

export default (
	context: Context,
	path: string[],
	value: FieldValue,
	record: WireRecord
) => {
	const recordId = record.id
	dispatch(
		updateRecord({
			recordId,
			record: value,
			entity: record.getWire().getFullId(),
			path,
		})
	)

	const wire = context.getWire(record.getWire().getId())

	if (!wire) return context

	const fullPath = path.join("->")

	// NOTE: Order here is important, we must run internal handlers first
	// before broadcasting to the external world

	// FIRST - run event handlers defined on the wire itself
	wire.handleEvent("onChange", context, fullPath)

	// SECOND - publish events to notify external subscribers
	const latestRecord = wire.getRecord(recordId)
	publish("wire.record.updated", {
		wireId: wire.getFullId(),
		recordId: record.id,
		field: fullPath,
		value,
		record: latestRecord,
	})

	return context
}
