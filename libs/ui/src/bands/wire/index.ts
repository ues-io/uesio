import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { SaveResponseBatch } from "../../load/saveresponse"
import { WireConditionState } from "../../wireexports"
import { ID_FIELD, PlainCollection } from "../collection/types"
import { createEntityReducer, EntityPayload } from "../utils"
import { FieldValue, PlainWireRecord } from "../wirerecord/types"
import wireAdapter from "./adapter"
import loadOp from "./operations/load"
import loadNextBatch from "./operations/loadnextbatch"
import saveOp from "./operations/save"
import { PlainWire } from "./types"
import set from "lodash/set"
import get from "lodash/get"

type DeletePayload = {
	recordId: string
} & EntityPayload

type UndeletePayload = {
	recordId: string
} & EntityPayload

type UpdateRecordPayload = {
	recordId: string
	record: FieldValue
	path: string[]
} & EntityPayload

type CreateRecordPayload = {
	record: PlainWireRecord
	recordId: string
} & EntityPayload

type ToggleConditionPayload = {
	conditionId: string
} & EntityPayload

type AddConditionPayload = {
	condition: WireConditionState
} & EntityPayload

type RemoveConditionPayload = {
	conditionId: string
} & EntityPayload

type ResetWirePayload = {
	data: Record<string, PlainWireRecord>
	original: Record<string, PlainWireRecord>
	changes: Record<string, PlainWireRecord>
} & EntityPayload

const wireSlice = createSlice({
	name: "wire",
	initialState: wireAdapter.getInitialState(),
	reducers: {
		markForDelete: createEntityReducer<DeletePayload, PlainWire>(
			(state, { recordId }) => {
				state.deletes[recordId] = {
					[ID_FIELD]: state.data[recordId][ID_FIELD],
				}
			}
		),
		unmarkForDelete: createEntityReducer<UndeletePayload, PlainWire>(
			(state, { recordId }) => {
				delete state.deletes[recordId]
			}
		),
		updateRecord: createEntityReducer<UpdateRecordPayload, PlainWire>(
			(state, { record, recordId, path }) => {
				const usePath = [recordId].concat(path)
				const basePath = [recordId].concat([path[0]])
				set(state.data, usePath, record)
				set(state.changes, basePath, get(state.data, basePath))

				// Make sure the id field gets set.
				state.changes[recordId][ID_FIELD] =
					state.data[recordId][ID_FIELD]
			}
		),
		setRecord: createEntityReducer<UpdateRecordPayload, PlainWire>(
			(state, { record, recordId, path }) => {
				const usePath = [recordId].concat(path)
				set(state.data, usePath, record)
				set(state.original, usePath, record)
			}
		),
		createRecord: createEntityReducer<CreateRecordPayload, PlainWire>(
			(state, { record, recordId }) => {
				state.data = { ...state.data, [recordId]: record || {} }
				state.changes = { ...state.changes, [recordId]: record || {} }
			}
		),
		cancel: createEntityReducer<EntityPayload, PlainWire>((state) => {
			state.data = state.original || {}
			state.changes = {}
			state.deletes = {}
		}),
		init: wireAdapter.upsertMany,
		empty: createEntityReducer<EntityPayload, PlainWire>((state) => {
			state.data = {}
			state.changes = {}
			state.deletes = {}
		}),
		reset: createEntityReducer<ResetWirePayload, PlainWire>(
			(state, { data, changes, original }) => {
				state.data = data
				state.changes = changes
				state.original = original
				state.deletes = {}
			}
		),
		addCondition: createEntityReducer<AddConditionPayload, PlainWire>(
			(state, { condition }) => {
				const conditionIndex = state.conditions.findIndex(
					(existingCondition) => existingCondition.id === condition.id
				)
				if (conditionIndex === -1) {
					// Create a new condition
					state.conditions.push(condition)
					return
				}
				state.conditions = Object.assign([], state.conditions, {
					[conditionIndex]: condition,
				})
			}
		),
		removeCondition: createEntityReducer<RemoveConditionPayload, PlainWire>(
			(state, { conditionId }) => {
				const conditionIndex = state.conditions.findIndex(
					(condition) => condition.id === conditionId
				)
				if (conditionIndex === -1) {
					return
				}
				state.conditions.splice(conditionIndex, 1)
			}
		),
		toggleCondition: createEntityReducer<ToggleConditionPayload, PlainWire>(
			(state, { conditionId }) => {
				const conditionIndex = state.conditions.findIndex(
					(condition) => condition.id === conditionId
				)
				if (conditionIndex === -1) {
					return
				}
				const oldCondition = state.conditions[conditionIndex]

				// modify existing array without mutation
				state.conditions = Object.assign([], state.conditions, {
					[conditionIndex]: {
						...oldCondition,
						active: !oldCondition.active,
					},
				})
			}
		),
	},
	extraReducers: (builder) => {
		builder.addCase(
			loadOp.fulfilled,
			(
				state,
				{
					payload: [wires],
				}: PayloadAction<[PlainWire[], Record<string, PlainCollection>]>
			) => {
				wireAdapter.upsertMany(state, wires)
			}
		)
		builder.addCase(
			loadNextBatch.fulfilled,
			(
				state,
				{
					payload: [wires],
				}: PayloadAction<[PlainWire[], Record<string, PlainCollection>]>
			) => {
				wireAdapter.upsertMany(state, wires)
			}
		)
		builder.addCase(
			saveOp.fulfilled,
			(state, { payload }: PayloadAction<SaveResponseBatch>) => {
				const response = payload
				// TODO: This is definitely the wrong way to do this.
				// I think you could accomplish this with a single assign statement.
				if (response.wires) {
					response.wires.forEach((wire) => {
						const wireId = wire.wire
						if (wire.errors) return
						Object.keys(wire.changes).forEach((tempId) => {
							const data = state.entities[wireId]?.data
							if (!data) return
							state.entities = Object.assign({}, state.entities, {
								[wireId]: Object.assign(
									{},
									state.entities[wireId],
									{
										data: Object.assign({}, data, {
											[tempId]: Object.assign(
												{},
												data[tempId],
												wire.changes[tempId]
											),
										}),
										changes: {},
										original: Object.assign({}, data, {
											[tempId]: Object.assign(
												{},
												data[tempId],
												wire.changes[tempId]
											),
										}),
									}
								),
							})
						})
						Object.keys(wire.deletes).forEach((tempId) => {
							const newData: Record<string, PlainWireRecord> = {}
							const newOriginal: Record<string, PlainWireRecord> =
								{}
							const data = state.entities[wireId]?.data
							if (!data) return
							Object.keys(data)
								.filter((recordId) => recordId !== tempId)
								.forEach((recordId) => {
									newData[recordId] = data[recordId]
									newOriginal[recordId] = data[recordId]
								})
							state.entities = Object.assign({}, state.entities, {
								[wireId]: Object.assign(
									{},
									state.entities[wireId],
									{
										data: newData,
										original: newOriginal,
									}
								),
							})
						})

						// Remove errors on a successful save
						state.entities = Object.assign({}, state.entities, {
							[wireId]: Object.assign(
								{},
								state.entities[wireId],
								{
									error: null,
								}
							),
						})
					})
				}
			}
		)
		builder.addCase(saveOp.rejected, (state, action) => {
			const viewId = action.meta.arg.context.getViewId()
			// This doesn't handle the case where the wire comes from context
			// instead of the definition
			action.meta.arg.wires?.forEach((entityName) => {
				const entity = state.entities[`${viewId}/${entityName}`]
				if (entity) {
					entity.error = action.error.message
				}
			})
		})
	},
})

export const {
	markForDelete,
	unmarkForDelete,
	updateRecord,
	setRecord,
	createRecord,
	cancel,
	empty,
	reset,
	init,
	toggleCondition,
	addCondition,
	removeCondition,
} = wireSlice.actions
export default wireSlice.reducer
