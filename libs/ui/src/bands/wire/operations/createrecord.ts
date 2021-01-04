import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import shortid from "shortid"
import { createRecord } from ".."
import { getDefaultRecord } from "../defaults/defaults"

export default (context: Context, wirename: string): ThunkFunc => async (
	dispatch,
	getState
) => {
	const viewId = context.getViewId()
	if (!viewId) return context
	const recordId = shortid.generate()
	dispatch(
		createRecord({
			recordId,
			record: getDefaultRecord(
				context,
				getState().wire.entities,
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
