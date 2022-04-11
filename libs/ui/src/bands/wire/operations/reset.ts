import { ThunkFunc } from "../../../store/store"
import { Context, getWireDefFromWireName } from "../../../context/context"
import { reset } from ".."
import { getDefaultRecord } from "../defaults/defaults"
import { nanoid } from "nanoid"
import { PlainWireRecord } from "../../wirerecord/types"

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch, getState) => {
		const viewId = context.getViewId()
		if (!viewId) return context
		const wireDef = getWireDefFromWireName(viewId, wirename)
		const autoCreateRecord = !!wireDef?.init?.create
		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		const changes: Record<string, PlainWireRecord> = {}

		const state = getState()
		const dataArray = []

		const wire = state.wire.entities[wirename]
		if (!wire) return context

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
