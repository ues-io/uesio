import { RootState, dispatch, getCurrentState } from "../../../store/store"
import { Context } from "../../../context/context"
import { nanoid } from "@reduxjs/toolkit"
import { createRecord, getFullWireId } from ".."
import { getDefaultRecord } from "../defaults/defaults"
import { PlainWireRecord } from "../../wirerecord/types"
import { batch } from "react-redux"
import { PlainWire } from "../types"

const mergeDefaultRecord = ({
	context,
	state,
	wire,
	record,
}: {
	context: Context
	state: RootState
	wire: PlainWire
	record?: PlainWireRecord
}) => ({
	...getDefaultRecord(
		context,
		state.wire.entities,
		state.collection.entities,
		wire
	),
	...(record || {}),
})

const createRecordOp = ({
	context,
	wirename,
	prepend,
	record,
}: {
	context: Context
	record?: PlainWireRecord
	wirename: string
	prepend?: boolean
}) => {
	const viewId = context.getViewId()
	if (!viewId) return context

	const recordId = nanoid()
	const state = getCurrentState()
	const wireId = getFullWireId(viewId, wirename)
	const wire = state.wire.entities[wireId]
	if (!wire) return context
	dispatch(
		createRecord({
			recordId,
			record: mergeDefaultRecord({ context, state, wire, record }),
			entity: wireId,
			prepend: !!prepend,
		})
	)
	return context.addRecordFrame({
		record: recordId,
		wire: wirename,
		view: viewId,
	})
}

const createRecordsOp = ({
	context,
	records,
	wirename,
	prepend,
}: {
	context: Context
	records: PlainWireRecord[]
	wirename: string
	prepend?: boolean
}) => {
	const viewId = context.getViewId()
	if (!viewId) return context

	const state = getCurrentState()
	const wireId = getFullWireId(viewId, wirename)
	const wire = state.wire.entities[wireId]
	if (!wire) return context

	batch(() => {
		records.forEach((record) => {
			const recordId = nanoid()
			dispatch(
				createRecord({
					recordId,
					record: mergeDefaultRecord({
						context,
						state,
						wire,
						record,
					}),
					entity: wireId,
					prepend: !!prepend,
				})
			)
		})
	})

	return context
}

export { createRecordOp, createRecordsOp }
