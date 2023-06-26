import { dispatch, getCurrentState } from "../../../store/store"
import { Context } from "../../../context/context"
import { reset, getFullWireId } from ".."
import { batch } from "react-redux"
import { createRecordOp } from "./createrecord"

export default (context: Context, wireName: string) => {
	const viewId = context.getViewId()
	if (!viewId) return context

	const state = getCurrentState()

	const wireId = getFullWireId(viewId, wireName)
	const wire = state.wire.entities[wireId]
	if (!wire) return context

	batch(() => {
		dispatch(
			reset({
				entity: getFullWireId(viewId, wireName),
			})
		)
		if (wire.create) {
			createRecordOp({ context, wireName })
		}
	})

	return context
}
