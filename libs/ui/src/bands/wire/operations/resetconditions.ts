import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { setConditionValue, getFullWireId } from ".."
import { isValueCondition } from "../conditions/conditions"

export default (context: Context, wireName: string) => {
	//this returns the original wire definition
	const viewDef = context.getViewDef()
	const wireDef = viewDef?.wires?.[wireName]
	if (wireDef && !wireDef.viewOnly && wireDef.conditions) {
		const viewId = context.getViewId()
		wireDef.conditions.forEach((condition) => {
			if (condition.id && isValueCondition(condition)) {
				const { id, value, values } = condition
				dispatch(
					setConditionValue({
						entity: getFullWireId(viewId, wireName),
						id,
						value,
						values,
					})
				)
			}
		})
	}
	return context
}
