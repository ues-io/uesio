import { Context } from "../../../context/context"
import { updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { runManyThrottled } from "../../../signals/signals"
import { dispatch } from "../../../store/store"

export default (
	context: Context,
	path: string[],
	value: FieldValue,
	wireId: string
) => {
	const fieldPath = path.join("->")
	const recordId = context.getRecordId()
	if (!recordId) return context
	const wire = wireId ? context.getWireByName(wireId) : context.getWire()
	if (!wire) return context

	// Append the id field when we're dealing with ref fields
	const baseFieldType = wire
		.getCollection()
		.getBaseFieldMetadata(fieldPath)?.type
	const isRef = baseFieldType === "REFERENCE"
	const isMap = baseFieldType === "MAP"

	if (!isRef && !isMap && path.length > 1)
		throw new Error(`Fieldpath contains too may items: ${fieldPath}`)

	const updatePath = [
		...path,
		// Conditionally add the id field to the path for refs where the value is not an object
		...(isRef && typeof value === "string" && path.length === 1
			? ["uesio/core.id"]
			: []),
	]

	dispatch(
		updateRecord({
			recordId,
			record: value,
			entity: wire.getFullId(),
			path: updatePath,
		})
	)
	// Now run change events
	const changeEvents = wire?.source.events?.onChange

	if (changeEvents) {
		for (const changeEvent of changeEvents) {
			if (changeEvent.field !== path[0]) continue
			runManyThrottled(changeEvent.signals, context)
		}
	}

	return context
}
