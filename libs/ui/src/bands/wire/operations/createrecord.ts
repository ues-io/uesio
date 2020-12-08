import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AnyAction } from "redux"
import RuntimeState from "../../../store/types/runtimestate"
import shortid from "shortid"
import { createRecord } from ".."
import { getDefaultRecord } from "../../../wire/wiredefault"

export default (context: Context, wirename: string) => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState
) => {
	const viewId = context.getViewId()
	if (!viewId) return context
	const recordId = shortid.generate()
	dispatch(
		createRecord({
			recordId,
			record: getDefaultRecord(context, getState(), viewId, wirename),
			entity: `${viewId}/${wirename}`,
		})
	)
	return context.addFrame({
		record: recordId,
		wire: wirename,
	})
}
