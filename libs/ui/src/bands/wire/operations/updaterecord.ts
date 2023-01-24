import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { updateRecord } from ".."
import { FieldValue } from "../../wirerecord/types"
import { runManyThrottled } from "../../../signals/signals"
import { getFieldPath } from "../../utils"

export default (
		context: Context,
		path: string[] | string,
		value: FieldValue,
		wireId?: string
	): ThunkFunc =>
	(dispatch) => {
		const { pathArray, pathString } = getFieldPath(path)
		const viewId = context.getViewId()
		if (!viewId) return context
		const recordId = context.getRecordId()
		if (!recordId) return context
		const wire = wireId ? context.getWireByName(wireId) : context.getWire()
		if (!wire) return context

		// Append the id field when we're dealing with ref fields
		const isRef =
			wire.getCollection().getField(pathString)?.getType() === "REFERENCE"
		const updatePath = [...pathArray, ...(isRef ? ["uesio/core.id"] : [])]

		dispatch(
			updateRecord({
				recordId,
				record: value,
				entity: wire.getFullId(),
				path: updatePath,
			})
		)

		// Now run change events
		const changeEvents = wire.source.events?.onChange

		if (changeEvents) {
			for (const changeEvent of changeEvents) {
				if (changeEvent.field !== path[0]) continue
				runManyThrottled(changeEvent.signals, context)
			}
		}

		return context
	}
