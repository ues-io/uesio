import { dispatch, getCurrentState } from "../../../store/store"
import { Context } from "../../../context/context"
import { nanoid } from "@reduxjs/toolkit"
import { createRecord, getFullWireId } from ".."
import { getDefaultRecord } from "../defaults/defaults"

export default (context: Context, wirename: string, prepend?: boolean) => {
	const viewId = context.getViewId()
	if (!viewId) return context

	const recordId = nanoid()
	const state = getCurrentState()
	const wireId = getFullWireId(viewId, wirename)
	const wire = state.wire.entities[wireId]
	if (!wire) return context
	dispatch(
		createRecord({
			recordId,
			record: getDefaultRecord(
				context,
				state.wire.entities,
				state.collection.entities,
				wire
			),
			entity: wireId,
			prepend: !!prepend,
		})
	)
	return context.addRecordFrame({
		wire: wirename,
		record: recordId,
	})
}
