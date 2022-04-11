import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { updateRecord } from ".."

export default (
		context: Context,
		wirename: string,
		recordId: string,
		field: string,
		value: string
	): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (!viewId) return context
		if (recordId) {
			recordId = context.merge(recordId)
		} else {
			recordId = context.getRecordId() || ""
		}

		if (!recordId) return context

		dispatch(
			updateRecord({
				recordId,
				record: context.merge(value),
				entity: `${viewId}/${wirename || context.getWireId()}`,
				path: [field],
			})
		)
		return context
	}
