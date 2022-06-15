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
		console.log("1")
		const viewDef = context.getViewDef()
		console.log("2")
		if (!viewDef) return context

		const recordId = nanoid()
		const state = getState()
		const wireId = getFullWireId(viewId, wirename)
		const wire = state.wire.entities[wireId]
		if (!wire) return context
		const record = getDefaultRecord(
			context,
			state.wire.entities,
			state.collection.entities,
			viewId,
			wire.def,
			wire.collection
		)
		console.log("3", record)
		dispatch(
			createRecord({
				recordId,
				record,
				entity: `${viewId}:${wirename}`,
				prepend: !!prepend,
			})
		)
		console.log("4", {
			record: recordId,
			wire: wirename,
		})
		return context.addFrame({
			record: recordId,
			wire: wirename,
		})
	}
