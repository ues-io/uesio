import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { setConditionValue, getFullWireId } from ".."

export default (context: Context, wireName: string) => {
	//this returns the original wire definition
	const viewDef = context.getViewDef()
	const wireDef = viewDef?.wires?.[wireName]
	if (wireDef && !wireDef.viewOnly && wireDef.conditions) {
		wireDef.conditions.forEach((condition) => {
			if (condition.id && condition.valueSource === "VALUE") {
				dispatch(
					setConditionValue({
						entity: getFullWireId(context.getViewId(), wireName),
						id: condition.id,
						value: condition.value,
					})
				)
			}
		})
	}
	return context
}
