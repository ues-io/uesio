import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AnyAction } from "redux"
import { removeCondition } from ".."

export default (context: Context, wirename: string, conditionId: string) =>
	(dispatch: Dispatcher<AnyAction>) => {
		const viewId = context.getViewId()
		if (viewId)
			dispatch(
				removeCondition({
					entity: `${viewId}/${wirename}`,
					conditionId,
				})
			)
		return context
	}
