import { dispatch } from "../../../store/store"
import { setConditionValue, getFullWireId, SetConditionValuePayload } from ".."
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
	if (viewId && wire) {
		const payload = {
			entity: getFullWireId(viewId, wire),
			id: conditionId,
		} as SetConditionValuePayload
		if (value ?? false) {
			payload.value = value
		}
		if (values ?? false) {
			payload.values = values
		}
		dispatch(setConditionValue(payload))
	}
	return context
}
