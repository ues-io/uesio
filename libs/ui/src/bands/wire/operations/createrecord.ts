import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { nanoid } from "nanoid"
import { createRecord } from ".."
import { getFullWireId } from "../selectors"
import { getDefaultRecord } from "../defaults/defaults"

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch, getState) => {
		const viewId = context.getViewId()
		if (!viewId) return context
		const viewDef = context.getViewDef()
		if (!viewDef) return context

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
					viewId,
					wire.def,
					wire.collection
				),
				entity: `${viewId}/${wirename}`,
			})
		)
		return context.addFrame({
			record: recordId,
			wire: wirename,
		})
	}
