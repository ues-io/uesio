import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { reset, getFullWireId } from ".."
import { PlainWireRecord } from "../../wirerecord/types"

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch, getState) => {
		const viewId = context.getViewId()
		if (!viewId) return context

		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		const changes: Record<string, PlainWireRecord> = {}

		const state = getState()

		const wireId = getFullWireId(viewId, wirename)
		const wire = state.wire.entities[wireId]
		if (!wire) return context

		dispatch(
			reset({
				entity: getFullWireId(viewId, wirename),
				data,
				original,
				changes,
			})
		)
		return context
	}
