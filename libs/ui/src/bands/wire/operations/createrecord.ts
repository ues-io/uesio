import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { nanoid } from "nanoid"
import { createRecord } from ".."
import { getDefaultRecord } from "../defaults/defaults"

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch, getState) => {
		const viewId = context.getViewId()
		if (!viewId) return context
		const viewDef = context.getViewDef()
		if (!viewDef) return context
		const wireDef = viewDef.definition?.wires?.[wirename]
		if (!wireDef) return context
		const recordId = nanoid()
		const state = getState()

		dispatch(
			createRecord({
				recordId,
				record: getDefaultRecord(
					context,
					state.wire.entities,
					state.collection.entities,
					viewId,
					wireDef
				),
				entity: `${viewId}/${wirename}`,
			})
		)
		return context.addFrame({
			record: recordId,
			wire: wirename,
		})
	}
