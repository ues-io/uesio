import { createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit"
import { SaveResponseBatch, SaveError } from "../../load/saveresponse"
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

type AddErrorPayload = {
	recordId: string
	fieldId: string
	message: string
} & EntityPayload

type RemoveErrorPayload = {
	recordId: string
	fieldId: string
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

type InitPayload = [PlainWire[], Record<string, PlainCollection>]

const wireSlice = createSlice({
	name: "wire",
	initialState: wireAdapter.getInitialState(),
	reducers: {
		addError: createEntityReducer<AddErrorPayload, PlainWire>(
			(state, { recordId, fieldId, message }) => {
				const recordFieldKey = `${recordId}:${fieldId}`
				const newErrorItem = {
					recordid: recordId,
					fieldid: fieldId,
					message,
				}

				// We don't want duplicate error messages
				if (
					state.errors &&
					state.errors[recordFieldKey] &&
					state.errors[recordFieldKey].some(
						(el) => el.message === newErrorItem.message
					)
				)
					return

				const currentFieldErrors = state.errors
					? state.errors[recordFieldKey]
					: []

				state.errors = {
					...state.errors,
					[recordFieldKey]: [...currentFieldErrors, newErrorItem],
				}
			}
		),
		removeError: createEntityReducer<RemoveErrorPayload, PlainWire>(
			(state, { recordId, fieldId }) => {
				console.log("something is right")
				delete state.errors?.[`${recordId}:${fieldId}`]
			}
		),
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
			state.errors = {}
		}),
		init: (
			state: EntityState<PlainWire>,
			action: PayloadAction<InitPayload>
		) => wireAdapter.upsertMany(state, action.payload[0]),
		empty: createEntityReducer<EntityPayload, PlainWire>((state) => {
			state.data = {}
			state.changes = {}
			state.deletes = {}
			state.errors = {}
		}),
		reset: createEntityReducer<ResetWirePayload, PlainWire>(
			(state, { data, changes, original }) => {
				state.data = data
				state.changes = changes
				state.original = original
				state.deletes = {}
				state.errors = {}
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
				payload.wires?.forEach((wire) => {
					const wireId = wire.wire
					const wireState = state.entities[wireId]
					if (!wireState) return

					if (wire.errors) {
						wireState.errors = {}
						const errorObj = wireState.errors
						wire.errors.forEach((error) => {
							const key = `${error.recordid || ""}:${
								error.fieldid || ""
							}`
							if (!errorObj[key]) {
								errorObj[key] = []
							}
							errorObj[key].push(error)
						})
						return
					}

					const data = wireState.data
					const original = wireState.original
					if (!data || !original) return

					Object.keys(wire.changes).forEach((tempId) => {
						data[tempId] = {
							...data[tempId],
							...wire.changes[tempId],
						}
						original[tempId] = {
							...data[tempId],
							...wire.changes[tempId],
						}
					})
					wireState.changes = {}

					Object.keys(wire.deletes).forEach((tempId) => {
						delete data[tempId]
						delete original[tempId]
						delete wireState.deletes[tempId]
					})

					wireState.errors = undefined
				})
			}
		)
		builder.addCase(saveOp.rejected, (state, action) => {
			const viewId = action.meta.arg.context.getViewId()
			// This doesn't handle the case where the wire comes from context
			// instead of the definition
			action.meta.arg.wires?.forEach((entityName) => {
				const entity = state.entities[`${viewId}/${entityName}`]
				if (entity) {
					entity.errors = {
						test: [{ message: action.error.message || "" }],
					}
				}
			})
		})
	},
})

export const {
	markForDelete,
	addError,
	removeError,
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
