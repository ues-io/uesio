import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { addCondition, getFullWireId } from ".."
import { WireConditionState } from "../conditions/conditions"

export default (
	context: Context,
	wirename: string,
	condition: WireConditionState
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			addCondition({
				entity: getFullWireId(viewId, wirename),
				condition,
			})
		)
	return context
}
