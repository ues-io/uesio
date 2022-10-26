import {
	createEntityAdapter,
	createSlice,
	EntityState,
	PayloadAction,
} from "@reduxjs/toolkit"
import { SaveResponseBatch } from "../../load/saveresponse"
import { WireConditionState } from "../../wireexports"
import { ID_FIELD, PlainCollection } from "../collection/types"
import { createEntityReducer, EntityPayload, initEntity } from "../utils"
import { FieldValue, PlainWireRecord } from "../wirerecord/types"
import { PlainWire } from "./types"
import set from "lodash/set"
import get from "lodash/get"
import { RootState } from "../../store/store"
import { Context, getWire } from "../../context/context"
import { useSelector } from "react-redux"
import { MetadataKey } from "../builder/types"

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
	prepend: boolean
} & EntityPayload

type ToggleConditionPayload = {
	id: string
} & EntityPayload

type AddConditionPayload = {
	condition: WireConditionState
} & EntityPayload

type SetConditionValuePayload = {
	id: string
	value: string
} & EntityPayload

type RemoveOrderPayload = {
	fields: string[]
} & EntityPayload

type AddOrderPayload = {
	order: { field: MetadataKey; desc: boolean }
} & EntityPayload

type SetOrderPayload = {
	order: { field: MetadataKey; desc: boolean }[]
} & EntityPayload

type RemoveConditionPayload = {
	conditionId: string
} & EntityPayload

type WireLoadAction = PayloadAction<
	[PlainWire[], Record<string, PlainCollection>]
>

const wireAdapter = createEntityAdapter<PlainWire>({
	selectId: (wire) => getFullWireId(wire.view, wire.name),
})

const selectors = wireAdapter.getSelectors((state: RootState) => state.wire)

const getWires = (
	wires: string[] | string | undefined,
	context: Context
): PlainWire[] => {
	const viewId = context.getViewId()
	if (!viewId) throw new Error("No ViewId in Context")
	const wiresArray = Array.isArray(wires) ? wires : [wires]
	return wiresArray.flatMap((wirename) => {
		const wire = getWire(viewId, wirename)
		if (!wire) throw new Error("Bad Wire!")
		return wire
	})
}

const addLookupWires = (wires: PlainWire[], context: Context): PlainWire[] => {
	const wireNamesToLookup = wires.flatMap(
		(wire) =>
			wire.conditions?.flatMap((c) => {
				const lookupWire = "lookupWire" in c && c.lookupWire
				if (!lookupWire) return []
				// Now check to make sure we're not already loading this wire
				return wires.find((wire) => wire.name === lookupWire)
					? []
					: [lookupWire]
			}) || []
	)

	// If we don't have any lookup wires, quit
	if (!wireNamesToLookup.length) return wires

	const lookupWires = getWires(wireNamesToLookup, context)

	// Recursively lookup wires
	return addLookupWires(lookupWires, context).concat(wires)
}

const getWiresFromDefinitonOrContext = (
	wires: string[] | string | undefined,
	context: Context
): PlainWire[] => {
	if (wires) {
		return getWires(wires, context)
	}
	const wire = context.getPlainWire()
	if (!wire) throw new Error("No Wire in Definition or Context")
	return [wire]
}

const wireSlice = createSlice({
	name: "wire",
	initialState: wireAdapter.getInitialState(),
	reducers: {
		initAll: initEntity<PlainWire>,
		upsertMany: wireAdapter.upsertMany,
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

				errors[recordFieldKey].push(newErrorItem)
			}
		),
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
			(state, { record, recordId, prepend }) => {
				const newRecord = { [recordId]: record || {} }
				state.data = {
					...(prepend && newRecord),
					...state.data,
					...(!prepend && newRecord),
				}
				state.changes = { ...state.changes, [recordId]: record || {} }
			}
		),
		cancel: createEntityReducer<EntityPayload, PlainWire>((state) => {
			state.data = state.original
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
		reset: createEntityReducer<EntityPayload, PlainWire>((state) => {
			state.data = {}
			state.changes = {}
			state.original = {}
			state.deletes = {}
			state.errors = {}
		}),
		addCondition: createEntityReducer<AddConditionPayload, PlainWire>(
			(state, { condition }) => {
				if (!state.conditions) state.conditions = []
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
		setConditionValue: createEntityReducer<
			SetConditionValuePayload,
			PlainWire
		>((state, { value, id }) => {
			if (!state.conditions) state.conditions = []
			const condition = state.conditions.find(
				(existingCondition) => existingCondition.id === id
			)
			if (condition?.valueSource === "VALUE") {
				condition.value = value
			}
		}),
		removeCondition: createEntityReducer<RemoveConditionPayload, PlainWire>(
			(state, { conditionId }) => {
				if (!state.conditions) return
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
			(state, { id }) => {
				if (!state.conditions) return
				const conditionIndex = state.conditions.findIndex(
					(condition) => condition.id === id
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
		setOrder: createEntityReducer<SetOrderPayload, PlainWire>(
			(state, { order }) => {
				state.order = order
			}
		),
		addOrder: createEntityReducer<AddOrderPayload, PlainWire>(
			(state, { order }) => {
				if (!state.order) state.order = []
				const orderIndex = state.order.findIndex(
					({ field }) => field === order.field
				)
				if (orderIndex === -1) {
					state.order.push(order)
					return
				}
				state.order = Object.assign([], state.order, {
					[orderIndex]: order,
				})
			}
		),
		removeOrder: createEntityReducer<RemoveOrderPayload, PlainWire>(
			(state, { fields }) => {
				if (!state.order) return
				state.order = state.order.filter(
					({ field }) => !fields.includes(field)
				)
			}
		),
		save: (state, { payload }: PayloadAction<SaveResponseBatch>) => {
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
		},
		load: (state, { payload: [wires] }: WireLoadAction) => {
			wireAdapter.upsertMany(state, wires)
		},
	},
})

// Both gets wire state and subscribes the component to wire changes
const useWire = (viewId?: string, wireName?: string): PlainWire | undefined =>
	useSelector((state: RootState) => selectWire(state, viewId, wireName))

const useWires = (
	fullWireIds: string[]
): Record<string, PlainWire | undefined> =>
	Object.fromEntries(
		Object.entries(useSelector(selectors.selectEntities)).filter(([key]) =>
			fullWireIds.includes(key)
		)
	)

const selectWire = (
	state: RootState,
	viewId: string | undefined,
	wireName: string | undefined
) =>
	viewId && wireName
		? selectors.selectById(state, getFullWireId(viewId, wireName))
		: undefined

const getFullWireId = (viewId: string, wireName: string) =>
	`${viewId}:${wireName}`

const getWireParts = (fullWireId: string): [string, string] => {
	const parts = fullWireId.split(":")
	return [parts[0], parts[1]]
}

export {
	useWire,
	useWires,
	selectWire,
	getFullWireId,
	getWireParts,
	WireLoadAction,
	selectors,
	getWiresFromDefinitonOrContext,
	addLookupWires,
}

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
	save,
	load,
	addOrder,
	setOrder,
	removeOrder,
	init,
	toggleCondition,
	addCondition,
	removeCondition,
	initAll,
	upsertMany,
	setConditionValue,
} = wireSlice.actions
export default wireSlice.reducer
