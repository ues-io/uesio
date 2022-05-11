import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { reset } from ".."
import { getDefaultRecord } from "../defaults/defaults"
import { nanoid } from "nanoid"
import { PlainWireRecord } from "../../wirerecord/types"
import { getFullWireId } from "../selectors"

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch, getState) => {
		const viewId = context.getViewId()
		if (!viewId) return context

		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		const changes: Record<string, PlainWireRecord> = {}

		const state = getState()
		const dataArray = []

		const wireId = getFullWireId(viewId, wirename)
		const wire = state.wire.entities[wireId]
		if (!wire) return context

		const wireDef = wire.def
		const autoCreateRecord = !!wireDef?.init?.create

		if (autoCreateRecord) {
			dataArray.push(
				getDefaultRecord(
					context,
					state.wire.entities,
					state.collection.entities,
					viewId,
					wireDef,
					wire.collection
				)
			)
		}

		dataArray?.forEach((item) => {
			const localId = nanoid()
			data[localId] = item
			original[localId] = item

			if (autoCreateRecord) {
				changes[localId] = item
			}
		})

		dispatch(
			reset({ entity: `${viewId}/${wirename}`, data, original, changes })
		)
		return context
	}
