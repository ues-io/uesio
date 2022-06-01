import { Context } from "../../context/context"
import { PropDescriptor } from "../../buildmode/buildpropdefinition"
import toggleDeleteOp from "./operations/toggledelete"
import markForDeleteOp from "./operations/markfordelete"
import unMarkForDeleteOp from "./operations/unmarkfordelete"
import createRecordOp from "./operations/createrecord"
import updateRecordOp from "./operations/updaterecord"
import cancelWireOp from "./operations/cancel"
import emptyWireOp from "./operations/empty"
import resetWireOp from "./operations/reset"
import searchWireOp from "./operations/search"
import toggleConditionOp from "./operations/togglecondition"
import setConditionOp from "./operations/setcondition"
import removeConditionOp from "./operations/removecondition"
import loadWiresOp from "./operations/load"
import loadNextBatchOp from "./operations/loadnextbatch"
import loadAllOp from "./operations/loadall"
import saveWiresOp from "./operations/save"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { RegularWireDefinition } from "../../definition/wire"
import {
	WireConditionDefinition,
	WireConditionState,
} from "./conditions/conditions"
import { Definition } from "../../definition/definition"

// The key for the entire band
const WIRE_BAND = "wire"

interface CreateRecordSignal extends SignalDefinition {
	wire: string
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
	condition: string
}

interface RemoveConditionSignal extends SignalDefinition {
	wire: string
	condition: string
}

interface SetConditionSignal extends SignalDefinition {
	wire: string
	condition: WireConditionState
}

interface LoadWiresSignal extends SignalDefinition {
	wires?: string[]
}

interface SaveWiresSignal extends SignalDefinition {
	wires?: string[]
}

interface SearchWireSignal extends SignalDefinition {
	wire: string
	search: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${WIRE_BAND}/TOGGLE_DELETE_STATUS`]: {
		label: "Toggle Delete Status",
		dispatcher: (signal: SignalDefinition, context: Context) =>
			toggleDeleteOp(context),
		properties: () => [],
	},
	[`${WIRE_BAND}/MARK_FOR_DELETE`]: {
		label: "Mark For Delete",
		dispatcher: (signal: SignalDefinition, context: Context) =>
			markForDeleteOp(context),
		properties: () => [],
	},
	[`${WIRE_BAND}/UNMARK_FOR_DELETE`]: {
		label: "Unmark For Delete",
		dispatcher: (signal: SignalDefinition, context: Context) =>
			unMarkForDeleteOp(context),
		properties: () => [],
	},
	[`${WIRE_BAND}/CREATE_RECORD`]: {
		label: "Create Record",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
		dispatcher: (signal: CreateRecordSignal, context: Context) =>
			createRecordOp(context, signal.wire),
	},
	[`${WIRE_BAND}/UPDATE_RECORD`]: {
		label: "Update Record",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "field",
				type: "TEXT",
				label: "Field",
			},
			{
				name: "value",
				type: "TEXT",
				label: "Value",
			},
			{
				name: "record",
				type: "TEXT",
				label: "Record ID",
			},
		],
		dispatcher: (signal: UpdateRecordSignal, context: Context) =>
			updateRecordOp(
				context,
				signal.wire,
				signal.record,
				signal.field,
				signal.value
			),
	},
	[`${WIRE_BAND}/CANCEL`]: {
		label: "Cancel Wire Changes",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
		dispatcher: (signal: CancelWireSignal, context: Context) =>
			cancelWireOp(context, signal.wire),
	},
	[`${WIRE_BAND}/EMPTY`]: {
		label: "Empty Wire",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
		dispatcher: (signal: EmptyWireSignal, context: Context) =>
			emptyWireOp(context, signal.wire),
	},
	[`${WIRE_BAND}/RESET`]: {
		label: "Reset Wire",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
		dispatcher: (signal: ResetWireSignal, context: Context) =>
			resetWireOp(context, signal.wire),
	},
	[`${WIRE_BAND}/SEARCH`]: {
		label: "Search Wire",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "search",
				type: "TEXT",
				label: "Search",
			},
		],
		dispatcher: (signal: SearchWireSignal, context: Context) =>
			searchWireOp(context, signal.wire, signal.search),
	},
	[`${WIRE_BAND}/TOGGLE_CONDITION`]: {
		label: "Toggle Wire Condition",
		dispatcher: (signal: ToggleConditionSignal, context: Context) =>
			toggleConditionOp(context, signal.wire, signal.condition),
		properties: (signal: SignalDefinition): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				filter: (def: Definition) =>
					Boolean(
						def && (<RegularWireDefinition>def).conditions?.length
					),
				label: "Wire",
			},
			{
				name: "conditionId",
				type: "CONDITION",
				filter: (def: Definition) =>
					Boolean(def && (<WireConditionDefinition>def).id),
				wire: <string>signal.wire,
				label: "condition",
			},
		],
	},
	[`${WIRE_BAND}/SET_CONDITION`]: {
		label: "Set Wire Condition",
		dispatcher: (signal: SetConditionSignal, context: Context) =>
			setConditionOp(context, signal.wire, signal.condition),
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
	},
	[`${WIRE_BAND}/REMOVE_CONDITION`]: {
		label: "Remove Wire Condition",
		dispatcher: (signal: RemoveConditionSignal, context: Context) =>
			removeConditionOp(context, signal.wire, signal.condition),
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
	},
	[`${WIRE_BAND}/LOAD`]: {
		label: "Load Wire(s)",
		dispatcher: (signal: LoadWiresSignal, context: Context) =>
			loadWiresOp(context, signal.wires),
		properties: (): PropDescriptor[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/LOAD_NEXT_BATCH`]: {
		label: "Load Next Batch",
		dispatcher: (signal: LoadWiresSignal, context: Context) =>
			loadNextBatchOp(context, signal.wires),
		properties: (): PropDescriptor[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/LOAD_ALL`]: {
		label: "Load All",
		dispatcher: (signal: LoadWiresSignal, context: Context) =>
			loadAllOp(context, signal.wires),
		properties: (): PropDescriptor[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/SAVE`]: {
		label: "Save Wire(s)",
		dispatcher: (signal: SaveWiresSignal, context: Context) =>
			saveWiresOp(context, signal.wires),
		properties: (): PropDescriptor[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
}

export default signals
