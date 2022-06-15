import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { addCondition } from ".."
import { WireConditionState } from "../conditions/conditions"

export default (
		context: Context,
		wirename: string,
		condition: WireConditionState
	): ThunkFunc =>
	(dispatch) => {
		const viewId = context.getViewId()
		if (viewId)
			dispatch(
				addCondition({
					entity: `${viewId}:${wirename}`,
					condition,
				})
			)
		return context
	}
