import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AnyAction } from "redux"
import { addCondition } from ".."
import { WireConditionState } from "../conditions/conditions"

export default (
		context: Context,
		wirename: string,
		condition: WireConditionState
	) =>
	(dispatch: Dispatcher<AnyAction>) => {
		const viewId = context.getViewId()
		if (viewId)
			dispatch(
				addCondition({
					entity: `${viewId}/${wirename}`,
					condition,
				})
			)
		return context
	}
