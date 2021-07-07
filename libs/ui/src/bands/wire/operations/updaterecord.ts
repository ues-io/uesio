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
		const idField = context
			.getRecord()
			?.getWire()
			.getCollection()
			.getIdField()
			?.getId()
		if (!idField) return context

		dispatch(
			updateRecord({
				recordId,
				record: {
					[field]: context.merge(value),
				},
				idField,
				entity: `${viewId}/${wirename}`,
			})
		)
		return context
	}
