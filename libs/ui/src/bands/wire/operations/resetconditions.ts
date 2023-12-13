import { dispatch } from "../../../store/store"
import { Context, Mergeable } from "../../../context/context"
import { setConditionValue, getFullWireId, SetConditionValuePayload } from ".."
import { isValueCondition } from "../conditions/conditions"
import { PlainFieldValue } from "../../wirerecord/types"

export default (context: Context, wireName: string) => {
	//this returns the original wire definition
	const viewDef = context.getViewDef()
	const wireDef = viewDef?.wires?.[wireName]
	if (wireDef && !wireDef.viewOnly && wireDef.conditions) {
		const viewId = context.getViewId()
		wireDef.conditions.forEach((condition) => {
			if (condition.id && isValueCondition(condition)) {
				const { id, value, values } = condition
				const payload = {
					entity: getFullWireId(viewId, wireName),
					id,
				} as SetConditionValuePayload
				if (value ?? false)
					payload.value = context.merge(value as Mergeable)
				if (values ?? false)
					payload.values = context.merge(
						values as Mergeable
					) as PlainFieldValue[]
				dispatch(setConditionValue(payload))
			}
		})
	}
	return context
}
