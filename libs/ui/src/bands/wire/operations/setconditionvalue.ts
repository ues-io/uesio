import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { setConditionValue, getFullWireId } from ".."
import { PlainFieldValue } from "../../wirerecord/types"

export default (
	context: Context,
	wireName: string,
	conditionId: string,
	value: PlainFieldValue
) => {
	const viewId = context.getViewId()
	if (viewId)
		dispatch(
			setConditionValue({
				entity: getFullWireId(viewId, wireName),
				id: conditionId,
				value,
			})
		)
	return context
}
