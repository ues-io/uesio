import { dispatch } from "../../../store/store"
import { setConditionValue, getFullWireId } from ".."
import { PlainFieldValue } from "../../wirerecord/types"
import { Context } from "../../../../src/context/context"

type SetConditionValueOperationPayload = {
	context: Context
	wire: string
	conditionId: string
	value?: PlainFieldValue
	values?: PlainFieldValue[]
}

export default (payload: SetConditionValueOperationPayload) => {
	const { context, wire, conditionId, value, values } = payload
	const viewId = context.getViewId()
	if (viewId && wire)
		dispatch(
			setConditionValue({
				entity: getFullWireId(viewId, wire),
				id: conditionId,
				value,
				values,
			})
		)
	return context
}
