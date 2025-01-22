import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit"
import { SaveError, SaveResponseBatch } from "../../load/saveresponse"
import { OrderState, WireConditionState } from "../../wireexports"
import { ID_FIELD, PlainCollectionMap } from "../collection/types"
import { createEntityReducer, EntityPayload } from "../utils"
import {
  FieldValue,
  PlainFieldValue,
  PlainWireRecord,
} from "../wirerecord/types"
import { PlainWire } from "./types"
import set from "lodash/set"
import get from "lodash/get"
import { RootState } from "../../store/store"
import { Context, getWire } from "../../context/context"
import { useSelector } from "react-redux"
import { isValueCondition } from "./conditions/conditions"
import { SelectListMetadataMap } from "../../definition/selectlist"

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

type RemoveRecordPayload = {
  recordId: string
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
  value?: FieldValue
  values?: FieldValue[]
  inactive?: boolean
} & EntityPayload

type RemoveOrderPayload = {
  fields: string[]
} & EntityPayload

type AddOrderPayload = {
  order: OrderState
} & EntityPayload

type SetOrderPayload = {
  order: OrderState[]
} & EntityPayload

type RemoveConditionPayload = {
  conditionId: string
} & EntityPayload

type SetConditionsPayload = {
  conditions: WireConditionState[]
} & EntityPayload

type WireLoadAction = PayloadAction<
  [
    PlainWire[],
    PlainCollectionMap | undefined,
    SelectListMetadataMap | undefined,
  ]
>

type SetIsLoadingAction = PayloadAction<PlainWire[]>

const adapter = createEntityAdapter({
  selectId: (wire: PlainWire) => getFullWireId(wire.view, wire.name),
})

const selectors = adapter.getSelectors((state: RootState) => state.wire)

const getWires = (
  wires: string[] | string | undefined,
  context: Context,
): PlainWire[] => {
  const viewId = context.getViewId()
  if (!viewId) throw new Error("No ViewId in Context")
  const wiresArray = Array.isArray(wires) ? wires : [wires]
  return wiresArray.flatMap((wirename) => {
    const wire = getWire(viewId, wirename)
    if (!wire) throw new Error("Invalid wire name " + wirename)
    return wire
  })
}

const processCondition = (
  condition: WireConditionState,
  wires: PlainWire[],
): string[] => {
  // ignore inactive conditions
  if (condition.inactive) return []
  const isGroupCondition = "type" in condition && condition.type === "GROUP"
  if (isGroupCondition) {
    return condition.conditions?.flatMap((c) => processCondition(c, wires))
  }
  const lookupWire = "lookupWire" in condition && condition.lookupWire
  if (!lookupWire) return []
  // Now check to make sure we're not already loading this wire
  return wires.find((wire) => wire.name === lookupWire) ? [] : [lookupWire]
}

const addLookupWires = (wires: PlainWire[], context: Context): PlainWire[] => {
  const wireNamesToLookup = wires.flatMap(
    (wire) => wire.conditions?.flatMap((c) => processCondition(c, wires)) || [],
  )
  // If we don't have any lookup wires, quit
  if (!wireNamesToLookup.length) return wires
  const lookupWires = getWires(wireNamesToLookup, context)
  // Recursively lookup wires
  return addLookupWires(lookupWires, context).concat(wires)
}

const getWiresFromDefinitonOrContext = (
  wires: string[] | string | undefined,
  context: Context,
): PlainWire[] => {
  if (wires) {
    return getWires(wires, context)
  }
  const wire = context.getPlainWire()
  if (!wire) throw new Error("No Wire in Definition or Context")
  return [wire]
}

const addErrorState = (
  currentErrors: Record<string, SaveError[]> | undefined = {},
  message: string,
  recordId?: string,
  fieldId?: string,
) => {
  const recordFieldKey = `${recordId}:${fieldId}`
  const newErrorItem = {
    recordid: recordId,
    fieldid: fieldId,
    message,
  }

  const currentFieldErrors = currentErrors[recordFieldKey]

  if (!currentFieldErrors) {
    currentErrors[recordFieldKey] = []
  }

  currentErrors[recordFieldKey].push(newErrorItem)
  return currentErrors
}

const wireSlice = createSlice({
  name: "wire",
  initialState: adapter.getInitialState(),
  reducers: {
    initAll: adapter.setAll,
    upsertMany: adapter.upsertMany,
    removeOne: adapter.removeOne,
    addError: createEntityReducer<AddErrorPayload, PlainWire>(
      (state, { recordId, fieldId, message }) => {
        state.errors = addErrorState(state.errors, message, recordId, fieldId)
      },
    ),
    removeError: createEntityReducer<RemoveErrorPayload, PlainWire>(
      (state, { recordId, fieldId }) => {
        delete state.errors?.[`${recordId}:${fieldId}`]
      },
    ),
    markForDelete: createEntityReducer<DeletePayload, PlainWire>(
      (state, { recordId }) => {
        const record = state.data[recordId]
        if (!record) return
        state.deletes[recordId] = {
          [ID_FIELD]: record[ID_FIELD],
        }
      },
    ),
    unmarkForDelete: createEntityReducer<UndeletePayload, PlainWire>(
      (state, { recordId }) => {
        delete state.deletes[recordId]
      },
    ),
    updateRecord: createEntityReducer<UpdateRecordPayload, PlainWire>(
      (state, { record, recordId, path }) => {
        const usePath = [recordId].concat(path)
        const basePath = [recordId].concat([path[0]])
        set(state.data, usePath, record)
        set(state.changes, basePath, get(state.data, basePath))

        // Make sure the id field gets set.
        state.changes[recordId][ID_FIELD] = state.data[recordId][ID_FIELD]
      },
    ),
    setRecord: createEntityReducer<UpdateRecordPayload, PlainWire>(
      (state, { record, recordId, path }) => {
        const usePath = [recordId].concat(path)
        set(state.data, usePath, record)
        set(state.original, usePath, record)
      },
    ),
    removeRecord: createEntityReducer<RemoveRecordPayload, PlainWire>(
      (state, { recordId }) => {
        delete state.data[recordId]
        delete state.changes[recordId]
      },
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
      },
    ),
    cancel: createEntityReducer<EntityPayload, PlainWire>((state) => {
      state.data = state.original
      state.changes = {}
      state.deletes = {}
      state.errors = {}
    }),
    init: (state: EntityState<PlainWire, string>, action: WireLoadAction) =>
      adapter.upsertMany(state, action.payload[0]),
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
          (existingCondition) => existingCondition.id === condition.id,
        )
        if (conditionIndex === -1) {
          // Create a new condition
          state.conditions.push(condition)
          return
        }
        state.conditions = Object.assign([], state.conditions, {
          [conditionIndex]: condition,
        })
      },
    ),
    setConditionValue: createEntityReducer<SetConditionValuePayload, PlainWire>(
      (state, { values, value, id, inactive }) => {
        if (!state.conditions) state.conditions = []
        const condition = state.conditions.find(
          (existingCondition) => existingCondition.id === id,
        )
        if (condition && isValueCondition(condition)) {
          let activateCondition = false
          if (value !== undefined) {
            condition.value = value as PlainFieldValue
            activateCondition = true
          }
          if (values !== undefined) {
            condition.values = values as PlainFieldValue[]
            activateCondition = true
          }
          if (inactive !== undefined) {
            condition.inactive = inactive
          } else if (activateCondition && condition.inactive) {
            condition.inactive = false
          }
        }
      },
    ),
    removeCondition: createEntityReducer<RemoveConditionPayload, PlainWire>(
      (state, { conditionId }) => {
        if (!state.conditions) return
        const conditionIndex = state.conditions.findIndex(
          (condition) => condition.id === conditionId,
        )
        if (conditionIndex === -1) {
          return
        }
        state.conditions.splice(conditionIndex, 1)
      },
    ),
    setConditions: createEntityReducer<SetConditionsPayload, PlainWire>(
      (state, { conditions }) => {
        state.conditions = conditions
      },
    ),
    toggleCondition: createEntityReducer<ToggleConditionPayload, PlainWire>(
      (state, { id }) => {
        if (!state.conditions) return
        const conditionIndex = state.conditions.findIndex(
          (condition) => condition.id === id,
        )
        if (conditionIndex === -1) {
          return
        }
        const oldCondition = state.conditions[conditionIndex]

        // modify existing array without mutation
        state.conditions = Object.assign([], state.conditions, {
          [conditionIndex]: {
            ...oldCondition,
            inactive: !oldCondition.inactive,
          },
        })
      },
    ),
    setOrder: createEntityReducer<SetOrderPayload, PlainWire>(
      (state, { order }) => {
        state.order = order
      },
    ),
    addOrder: createEntityReducer<AddOrderPayload, PlainWire>(
      (state, { order }) => {
        if (!state.order) state.order = []
        const orderIndex = state.order.findIndex(
          ({ field }) => field === order.field,
        )
        if (orderIndex === -1) {
          state.order.push(order)
          return
        }
        state.order = Object.assign([], state.order, {
          [orderIndex]: order,
        })
      },
    ),
    removeOrder: createEntityReducer<RemoveOrderPayload, PlainWire>(
      (state, { fields }) => {
        if (!state.order) return
        state.order = state.order.filter(({ field }) => !fields.includes(field))
      },
    ),
    save: (state, { payload }: PayloadAction<SaveResponseBatch>) => {
      payload.wires?.forEach((wire) => {
        const wireId = wire.wire
        const wireState = state.entities[wireId]
        if (!wireState) return

        if (wire.errors && wire.errors.length) {
          wireState.errors = {}
          const errorObj = wireState.errors
          wire.errors.forEach((error) => {
            const key = `${error.recordid || ""}:${error.fieldid || ""}`
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
      adapter.upsertMany(state, wires)
    },
    setIsLoading: (state, { payload: wires }: SetIsLoadingAction) => {
      adapter.upsertMany(
        state,
        wires.map(
          (wire) =>
            ({
              name: wire.name,
              view: wire.view,
              isLoading: true,
            }) as PlainWire,
        ),
      )
    },
  },
})

// Both gets wire state and subscribes the component to wire changes
const useWire = (viewId?: string, wireName?: string): PlainWire | undefined =>
  useSelector((state: RootState) => selectWire(state, viewId, wireName))

// This is just a copy from the redux "is" function
// Reference:
//  https://github.com/reduxjs/react-redux/blob/master/src/utils/shallowEqual.ts#L1
//  https://github.com/facebook/fbjs/blob/main/packages/fbjs/src/core/shallowEqual.js#L22
function is(x: unknown, y: unknown) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y
  } else {
    // eslint-disable-next-line no-self-compare -- handles NaN == NaN case
    return x !== x && y !== y
  }
}

// This is very similar to redux "shallowEqual", but instead of
// checking all keys, it only checks certain ones.
const getFilteredShallowEqualFunc =
  <T extends Record<string, unknown>>(ids: string[]) =>
  (objA: T, objB: T) => {
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) return false
    for (const id of ids) {
      if (!is(objA[id], objB[id])) {
        return false
      }
    }
    return true
  }

const useWires = (fullWireIds: string[]) =>
  Object.fromEntries(
    Object.entries(
      useSelector(
        selectors.selectEntities,
        getFilteredShallowEqualFunc(fullWireIds),
      ) as Record<string, PlainWire | undefined>,
    ).filter(([key]) => fullWireIds.includes(key)),
  )

const selectWire = (
  state: RootState,
  viewId: string | undefined,
  wireName: string | undefined,
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
  adapter,
  useWire,
  useWires,
  selectWire,
  getFullWireId,
  addErrorState,
  getWireParts,
  selectors,
  getWiresFromDefinitonOrContext,
  addLookupWires,
}

export type { SetConditionValuePayload, WireLoadAction }

export const {
  markForDelete,
  addError,
  removeError,
  unmarkForDelete,
  updateRecord,
  setRecord,
  removeRecord,
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
  setConditions,
  initAll,
  upsertMany,
  removeOne,
  setConditionValue,
  setIsLoading,
} = wireSlice.actions
export default wireSlice.reducer
