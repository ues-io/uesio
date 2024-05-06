import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { getFullWireId, setConditions } from ".."
import { WireConditionState } from "../conditions/conditions"

export default (
	context: Context,
	wireName: string,
	conditions: WireConditionState[]
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			setConditions({
				entity: getFullWireId(viewId, wireName),
				conditions,
			})
		)
	return context
}
