import { Context } from "../../../context/context"
import { updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
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

	const fullPath = path.join("->")
	wire.handleEvent("onChange", context, fullPath)

	// Publish events
	publish("wire.record.updated", {
		wireId: wire.getFullId(),
		recordId: record.id,
		field: fullPath,
		value,
		record,
	})

	return context
}
