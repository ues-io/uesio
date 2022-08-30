import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { nanoid } from "nanoid"
import { createRecord, getFullWireId } from ".."
import { getDefaultRecord } from "../defaults/defaults"

export default (
		context: Context,
		wirename: string,
		prepend?: boolean
	): ThunkFunc =>
	(dispatch, getState) => {
		const viewId = context.getViewId()
		if (!viewId) return context

		const recordId = nanoid()
		const state = getState()
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
		return context.addFrame({
			record: recordId,
			wire: wirename,
		})
	}
