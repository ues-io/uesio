import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AppThunk } from "../../../store/types/runtimestate"
import { AnyAction } from "redux"
import { toggleCondition } from ".."

export default (
	context: Context,
	wirename: string,
	conditionId: string
): AppThunk<Promise<Context>> => async (dispatch: Dispatcher<AnyAction>) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			toggleCondition({ entity: `${viewId}/${wirename}`, conditionId })
		)
	return context
}
