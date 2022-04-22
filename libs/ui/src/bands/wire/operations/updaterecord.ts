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
		console.log({ context, wirename, recordId, field, value })

		const viewId = context.getViewId()
		if (!viewId) return context
		if (recordId) {
			recordId = context.merge(recordId)
		} else {
			recordId = context.getRecordId() || ""
		}

		console.log("dos", { context, wirename, recordId, field, value })

		if (!recordId) return context

		console.log("3", { context, wirename, recordId, field, value })

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
