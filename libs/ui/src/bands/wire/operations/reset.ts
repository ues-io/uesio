import { dispatch, getCurrentState } from "../../../store/store"
import { Context } from "../../../context/context"
import { reset, getFullWireId } from ".."
import { batch } from "react-redux"
import createrecord from "./createrecord"

export default (context: Context, wirename: string) => {
	const viewId = context.getViewId()
	if (!viewId) return context

	const state = getCurrentState()

	const wireId = getFullWireId(viewId, wirename)
	const wire = state.wire.entities[wireId]
	if (!wire) return context

	batch(() => {
		dispatch(
			reset({
				entity: getFullWireId(viewId, wirename),
			})
		)
		if (wire.create) {
			createrecord(context, wirename)
		}
	})

	return context
}
