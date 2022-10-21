import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { setConditionValue, getFullWireId } from ".."

export default (
		context: Context,
		wirename: string,
		conditionId: string,
		value: string
	): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (viewId)
			dispatch(
				setConditionValue({
					entity: getFullWireId(viewId, wirename),
					id: conditionId,
					value,
				})
			)
		return context
	}
