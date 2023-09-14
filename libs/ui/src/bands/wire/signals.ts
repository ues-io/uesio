import { Context } from "../../context/context"
import toggleDeleteOp from "./operations/toggledelete"
import markForDeleteOp from "./operations/markfordelete"
import unMarkForDeleteOp from "./operations/unmarkfordelete"
import { createRecordOp } from "./operations/createrecord"
import cancelWireOp from "./operations/cancel"
import emptyWireOp from "./operations/empty"
import resetWireOp from "./operations/reset"

import {
	add as addOrderOp,
	set as setOrderOp,
	remove as removeOrderOp,
} from "./operations/order"

import searchWireOp from "./operations/search"
import toggleConditionOp from "./operations/togglecondition"
import setConditionOp from "./operations/setcondition"
import setConditionValueOp from "./operations/setconditionvalue"
import removeConditionOp from "./operations/removecondition"
import loadWiresOp from "./operations/load"
import initWiresOp from "./operations/initialize"
import loadNextBatchOp from "./operations/loadnextbatch"
import loadAllOp from "./operations/loadall"
import saveWiresOp from "./operations/save"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"

import { WireConditionState } from "./conditions/conditions"
import { MetadataKey } from "../../metadata/types"

// The key for the entire band
const WIRE_BAND = "wire"

interface CreateRecordSignal extends SignalDefinition {
	wire: string
	prepend?: boolean
}

interface UpdateRecordSignal extends SignalDefinition {
	wire: string
	field: string
	value: string
	record: string
}

interface CancelWireSignal extends SignalDefinition {
	wire: string
}

interface EmptyWireSignal extends SignalDefinition {
	wire: string
}

interface ResetWireSignal extends SignalDefinition {
	wire: string
}

interface ToggleConditionSignal extends SignalDefinition {
	wire: string
	conditionId: string
}

interface RemoveConditionSignal extends SignalDefinition {
	wire: string
	conditionId: string
}

interface SetConditionSignal extends SignalDefinition {
	wire: string
	condition: WireConditionState
}
interface SetConditionValueSignal extends SignalDefinition {
	wire: string
	value: string | number | boolean
	conditionId: string
}
interface SetOrderSignal extends SignalDefinition {
	wire: string
	order: { field: MetadataKey; desc: boolean }[]
}
interface AddOrderSignal extends SignalDefinition {
	wire: string
	field: MetadataKey
	desc: boolean
}
interface RemoveOrderSignal extends SignalDefinition {
	wire: string
	fields: MetadataKey[]
}

interface DeleteSignal extends SignalDefinition {
	wire: string
}

interface LoadWiresSignal extends SignalDefinition {
	wires?: string[]
}
interface InitializeWiresSignal extends SignalDefinition {
	wireDefs: string[]
}

interface SaveWiresSignal extends SignalDefinition {
	wires?: string[]
}

interface SearchWireSignal extends SignalDefinition {
	wire: string
	search: string
	searchFields?: string[]
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${WIRE_BAND}/TOGGLE_DELETE_STATUS`]: {
		dispatcher: (signal: DeleteSignal, context: Context) =>
			toggleDeleteOp(context, signal.wire),
	},
	[`${WIRE_BAND}/MARK_FOR_DELETE`]: {
		dispatcher: (signal: DeleteSignal, context: Context) =>
			markForDeleteOp(context, signal.wire),
	},
	[`${WIRE_BAND}/UNMARK_FOR_DELETE`]: {
		dispatcher: (signal: DeleteSignal, context: Context) =>
			unMarkForDeleteOp(context, signal.wire),
	},
	[`${WIRE_BAND}/CREATE_RECORD`]: {
		dispatcher: (signal: CreateRecordSignal, context: Context) => {
			const newContext = createRecordOp({
				context,
				wireName: signal.wire,
				prepend: signal.prepend,
			})
			// Add the newly-created record as a named Signal Output if this step has id
			if (signal.stepId) {
				const record = newContext.getRecord()
				if (record) {
					return newContext.addSignalOutputFrame(signal.stepId, {
						recordId: record?.getId(),
						record,
					})
				}
			}
			return newContext
		},
	},
	[`${WIRE_BAND}/UPDATE_RECORD`]: {
		dispatcher: (signal: UpdateRecordSignal, context: Context) => {
			let record = context.getRecord(signal.wire)
			// If there's no context record for this wire, use the first record on the wire
			if (!record && signal.wire) {
				const wire = context.getWire(signal.wire)
				if (wire) {
					record = wire.getFirstRecord()
				}
			}
			if (!record) return context
			return record.update(
				signal.field,
				context.merge(signal.value),
				context
			)
		},
	},
	[`${WIRE_BAND}/CANCEL`]: {
		dispatcher: (signal: CancelWireSignal, context: Context) =>
			cancelWireOp(context, signal.wire),
	},
	[`${WIRE_BAND}/EMPTY`]: {
		dispatcher: (signal: EmptyWireSignal, context: Context) =>
			emptyWireOp(context, signal.wire),
	},
	[`${WIRE_BAND}/RESET`]: {
		dispatcher: (signal: ResetWireSignal, context: Context) =>
			resetWireOp(context, signal.wire),
	},
	[`${WIRE_BAND}/SEARCH`]: {
		dispatcher: (signal: SearchWireSignal, context: Context) =>
			searchWireOp(
				context,
				signal.wire,
				signal.search,
				signal?.searchFields
			),
	},
	[`${WIRE_BAND}/TOGGLE_CONDITION`]: {
		dispatcher: (signal: ToggleConditionSignal, context: Context) =>
			toggleConditionOp(context, signal.wire, signal.conditionId),
	},

	[`${WIRE_BAND}/SET_CONDITION_VALUE`]: {
		dispatcher: (signal: SetConditionValueSignal, context: Context) =>
			setConditionValueOp(
				context,
				signal.wire,
				signal.conditionId,
				context.merge(signal.value)
			),
	},
	[`${WIRE_BAND}/SET_CONDITION`]: {
		dispatcher: (signal: SetConditionSignal, context: Context) =>
			setConditionOp(context, signal.wire, signal.condition),
	},
	[`${WIRE_BAND}/REMOVE_CONDITION`]: {
		dispatcher: (signal: RemoveConditionSignal, context: Context) =>
			removeConditionOp(context, signal.wire, signal.conditionId),
	},
	[`${WIRE_BAND}/SET_ORDER`]: {
		dispatcher: (signal: SetOrderSignal, context: Context) =>
			setOrderOp(context, signal.wire, signal.order),
	},
	[`${WIRE_BAND}/ADD_ORDER`]: {
		dispatcher: (signal: AddOrderSignal, context: Context) =>
			addOrderOp(context, signal.wire, signal.field, signal.desc),
	},
	[`${WIRE_BAND}/REMOVE_ORDER`]: {
		dispatcher: (signal: RemoveOrderSignal, context: Context) =>
			removeOrderOp(context, signal.wire, signal.fields),
	},
	[`${WIRE_BAND}/INIT`]: {
		dispatcher: (signal: InitializeWiresSignal, context: Context) =>
			initWiresOp(
				context,
				Object.fromEntries(
					signal.wireDefs.map((wirename) => [wirename, undefined])
				)
			),
	},
	[`${WIRE_BAND}/LOAD`]: {
		dispatcher: (signal: LoadWiresSignal, context: Context) =>
			loadWiresOp(context, signal.wires, true),
	},
	[`${WIRE_BAND}/LOAD_NEXT_BATCH`]: {
		dispatcher: (signal: LoadWiresSignal, context: Context) =>
			loadNextBatchOp(context, signal.wires),
	},
	[`${WIRE_BAND}/LOAD_ALL`]: {
		dispatcher: (signal: LoadWiresSignal, context: Context) =>
			loadAllOp(context, signal.wires),
	},
	[`${WIRE_BAND}/SAVE`]: {
		dispatcher: (signal: SaveWiresSignal, context: Context) =>
			saveWiresOp(context, signal.wires),
	},
}

export default signals
