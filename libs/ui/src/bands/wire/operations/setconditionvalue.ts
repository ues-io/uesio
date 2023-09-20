import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { setConditionValue, getFullWireId } from ".."

export default (
	context: Context,
	wireName: string,
	conditionId: string,
	value: string | number | boolean | undefined
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			setConditionValue({
				entity: getFullWireId(viewId, wireName),
				id: conditionId,
				value: context.merge(value),
			})
		)
	return context
}
