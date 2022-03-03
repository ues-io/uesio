import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { removeCondition } from ".."

export default (
		context: Context,
		wirename: string,
		conditionId: string
	): ThunkFunc =>
	(dispatch) => {
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
