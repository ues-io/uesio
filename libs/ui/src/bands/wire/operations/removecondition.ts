import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { removeCondition, getFullWireId } from ".."

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
					entity: getFullWireId(viewId, wirename),
					conditionId,
				})
			)
		return context
	}
