import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { addCondition, getFullWireId } from ".."
import { WireConditionState } from "../conditions/conditions"

export default (
	context: Context,
	wireName: string,
	condition: WireConditionState
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			addCondition({
				entity: getFullWireId(viewId, wireName),
				condition,
			})
		)
	return context
}
