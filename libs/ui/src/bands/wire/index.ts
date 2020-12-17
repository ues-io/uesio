import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { LoadResponseRecord } from "../../load/loadresponse"
import { SaveResponseBatch } from "../../load/saveresponse"
import { PlainCollection } from "../collection/types"
import { createEntityReducer, EntityPayload } from "../utils"
import { PlainWireRecord } from "../wirerecord/types"
import wireAdapter from "./adapter"
import loadOp from "./operations/load"
import saveOp from "./operations/save"
import { PlainWire } from "./types"

type DeletePayload = {
	recordId: string
	idField: string
} & EntityPayload

type UndeletePayload = {
	recordId: string
} & EntityPayload

type UpdateRecordPayload = {
	idField: string
	recordId: string
	record: PlainWireRecord
} & EntityPayload

type CreateRecordPayload = {
	record: LoadResponseRecord
	recordId: string
} & EntityPayload

type ToggleConditionPayload = {
	conditionId: string
} & EntityPayload

const wireSlice = createSlice({
	name: "wire",
	initialState: wireAdapter.getInitialState(),
	reducers: {
		markForDelete: createEntityReducer<DeletePayload, PlainWire>(
			(state, { recordId, idField }) => {
				state.deletes[recordId] = {
					[idField]: state.data[recordId][idField],
				}
			}
		),
		unmarkForDelete: createEntityReducer<UndeletePayload, PlainWire>(
			(state, { recordId }) => {
				delete state.deletes[recordId]
			}
		),
		updateRecord: createEntityReducer<UpdateRecordPayload, PlainWire>(
			(state, { idField, record, recordId }) => {
				state.data[recordId] = {
					...state.data[recordId],
					...record,
				}
				state.changes[recordId] = {
					...state.changes[recordId],
					...{
						...record,
						[idField]: state.data[recordId][idField],
					},
				}
			}
		),
		setRecord: createEntityReducer<UpdateRecordPayload, PlainWire>(
			(state, { idField, record, recordId }) => {
				state.data[recordId] = {
					...state.data[recordId],
					...record,
				}
				state.original[recordId] = {
					...state.original[recordId],
					...{
						...record,
						[idField]: state.data[recordId][idField],
					},
				}
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
		empty: createEntityReducer<EntityPayload, PlainWire>((state) => {
			state.data = {}
			state.changes = {}
			state.deletes = {}
		}),
		toggleCondition: createEntityReducer<ToggleConditionPayload, PlainWire>(
			(state, { conditionId }) => {
				const conditionIndex = state.conditions.findIndex(
					(condition) => condition.id === conditionId
				)
				if (!conditionIndex && conditionIndex !== 0) {
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
			saveOp.fulfilled,
			(
				state,
				{ payload }: PayloadAction<[SaveResponseBatch, string]>
			) => {
				const [response, viewId] = payload
				// TODO: This is definitely the wrong way to do this.
				// I think you could accomplish this with a single assign statement.
				if (response.wires) {
					response.wires.forEach((wire) => {
						const wireId = viewId + "/" + wire.wire
						Object.keys(wire.changeResults).forEach((tempId) => {
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
												wire.changeResults[tempId].data
											),
										}),
										changes: {},
										original: Object.assign({}, data, {
											[tempId]: Object.assign(
												{},
												data[tempId],
												wire.changeResults[tempId].data
											),
										}),
									}
								),
							})
						})
						Object.keys(wire.deleteResults).forEach((tempId) => {
							const newData: Record<string, PlainWireRecord> = {}
							const newOriginal: Record<
								string,
								PlainWireRecord
							> = {}
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

			action.meta.arg.wires.forEach((entityName) => {
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
	toggleCondition,
} = wireSlice.actions
export default wireSlice.reducer
