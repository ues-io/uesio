import {
	createEntityAdapter,
	createSlice,
	EntityState,
	isAnyOf,
	PayloadAction,
} from "@reduxjs/toolkit"
import { SaveResponseBatch } from "../../load/saveresponse"
import { WireConditionState } from "../../wireexports"
import { ID_FIELD, PlainCollection } from "../collection/types"
import { createEntityReducer, EntityPayload } from "../utils"
import { FieldValue, PlainWireRecord } from "../wirerecord/types"
import loadOp from "./operations/load"
import loadNextBatch from "./operations/loadnextbatch"
import saveOp from "./operations/save"
import { PlainWire } from "./types"
import set from "lodash/set"
import get from "lodash/get"
import { RootState } from "../../store/store"
import { Context, getWire } from "../../context/context"

type DeletePayload = {
	recordId: string
} & EntityPayload

type AddErrorPayload = {
	recordId: string
	fieldId: string
	message: string
} & EntityPayload

type RemoveRecordErrorsPayload = {
	recordId: string
	fieldId: string | null
} & EntityPayload

type RemoveErrorPayload = {
	recordId: string
	fieldId: string
} & EntityPayload

type UndeletePayload = {
	recordId: string
} & EntityPayload

type UpdateRecordPayload = {
	errors: string[]
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

type WireLoadAction = PayloadAction<
	[PlainWire[], Record<string, PlainCollection>]
>

const wireAdapter = createEntityAdapter<PlainWire>({
	selectId: (wire) => `${wire.view}/${wire.name}`,
})

const selectors = wireAdapter.getSelectors((state: RootState) => state.wire)

const getWiresFromDefinitonOrContext = (
	wires: string[] | string | undefined,
	context: Context
): PlainWire[] => {
	if (wires) {
		const viewId = context.getViewId()
		if (!viewId) throw new Error("No ViewId in Context")
		const wiresArray = Array.isArray(wires) ? wires : [wires]
		return wiresArray.flatMap((wirename) => {
			const wire = getWire(viewId, wirename)
			if (!wire) throw new Error("Bad Wire!")
			return wire
		})
	}
	const wire = context.getPlainWire()
	if (!wire) throw new Error("No Wire in Definition or Context")
	return [wire]
}

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

				let errors = state.errors

				if (!errors) {
					errors = {}
					state.errors = errors
				}

				const currentFieldErrors = errors[recordFieldKey]

				if (!currentFieldErrors) {
					errors[recordFieldKey] = []
				}

				// We don't want to display duplicate error messages
				if (
					currentFieldErrors &&
					currentFieldErrors.find(
						({ message: msg }) => msg === message
					)
				)
					return
				errors[recordFieldKey].push(newErrorItem)
			}
		),
		clearRecordErrors: createEntityReducer<
			RemoveRecordErrorsPayload,
			PlainWire
		>((state, { recordId, fieldId }) => {
			const result = Object.fromEntries(
				Object.entries(state.errors || {}).filter(([key]) =>
					fieldId
						? key !== `${recordId}:${fieldId}`
						: !key.startsWith(recordId)
				)
			)
			state.errors = result
		}),
		removeError: createEntityReducer<RemoveErrorPayload, PlainWire>(
			(state, { recordId, fieldId }) => {
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
		init: (state: EntityState<PlainWire>, action: WireLoadAction) =>
			wireAdapter.upsertMany(state, action.payload[0]),
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
			(state, { payload: [wires] }: WireLoadAction) => {
				wireAdapter.upsertMany(state, wires)
			}
		)
		builder.addCase(
			loadNextBatch.fulfilled,
			(state, { payload: [wires] }: WireLoadAction) => {
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
		builder.addMatcher(
			isAnyOf(updateRecord),
			(
				state,
				{ payload: { entity, errors: newErrors, recordId, path } }
			) => {
				const recordFieldKey = `${recordId}:${path[0]}`
				const entityObject = state.entities[entity]
				if (!entityObject) return state
				if (!entityObject.errors) entityObject.errors = {}

				entityObject.errors[recordFieldKey] = newErrors.map(
					(message) => ({
						message,
						recordid: recordId,
						fieldid: path[0],
					})
				)
			}
		)
	},
})

export { WireLoadAction }

export { selectors, getWiresFromDefinitonOrContext }

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
