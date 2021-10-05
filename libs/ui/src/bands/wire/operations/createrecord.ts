import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import shortid from "shortid"
import { createRecord } from ".."
import { getDefaultRecord } from "../defaults/defaults"

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch, getState) => {
		const viewId = context.getViewId()
		if (!viewId) return context
		const recordId = shortid.generate()
		const state = getState()
		dispatch(
			createRecord({
				recordId,
				record: getDefaultRecord(
					context,
					state.wire.entities,
					state.collection,
					viewId,
					wirename
				),
				entity: `${viewId}/${wirename}`,
			})
		)
		return context.addFrame({
			record: recordId,
			wire: wirename,
		})
	}
