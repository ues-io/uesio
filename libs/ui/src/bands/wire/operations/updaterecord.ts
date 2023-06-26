import { Context } from "../../../context/context"
import { updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { dispatch } from "../../../store/store"
import { publish } from "../../../hooks/eventapi"
import Wire from "../class"

export default (
	context: Context,
	path: string[],
	value: FieldValue,
	wire: Wire,
	recordId: string
) => {
	dispatch(
		updateRecord({
			recordId,
			record: value,
			entity: wire.getFullId(),
			path,
		})
	)

	const fullPath = path.join("->")

	// NOTE: Order here is important, we must run internal handlers first
	// before broadcasting to the external world

	// FIRST - run event handlers defined on the wire itself
	wire.handleEvent("onChange", context, fullPath)

	// SECOND - publish events to notify external subscribers
	const latestRecord = wire.getRecord(recordId)
	publish("wire.record.updated", {
		wireId: wire.getFullId(),
		recordId,
		field: fullPath,
		value,
		record: latestRecord,
	})

	return context
}
