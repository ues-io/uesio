import { Context } from "../../context/context"
import { PropDescriptor } from "../../buildmode/buildpropdefinition"
import toggleDeleteOp from "./operations/toggledelete"
import markForDeleteOp from "./operations/markfordelete"
import unMarkForDeleteOp from "./operations/unmarkfordelete"
import createRecordOp from "./operations/createrecord"
import cancelWireOp from "./operations/cancel"
import emptyWireOp from "./operations/empty"
import toggleConditionOp from "./operations/togglecondition"
import loadWiresOp from "./operations/load"
import saveWiresOp from "./operations/save"
import { Dispatcher } from "../../store/store"
import { AppThunk } from "../../store/types/runtimestate"
import { AnyAction } from "redux"
import { SignalDefinition } from "../../definition/signal"

// The key for the entire band
const WIRE_BAND = "wire"

interface CreateRecordSignal extends SignalDefinition {
	wire: string
}

interface CancelWireSignal extends SignalDefinition {
	wire: string
}

interface EmptyWireSignal extends SignalDefinition {
	wire: string
}

interface ToggleConditionSignal extends SignalDefinition {
	wire: string
	condition: string
}

interface LoadWiresSignal extends SignalDefinition {
	wires: string[]
}

interface SaveWiresSignal extends SignalDefinition {
	wires: string[]
}

// "Signal Handlers" for all of the signals in the band
export default {
	[`${WIRE_BAND}/TOGGLE_DELETE_STATUS`]: {
		label: "Toggle Delete Status",
		public: true,
		dispatcher: (signal: SignalDefinition, context: Context) =>
			toggleDeleteOp(context),
	},
	[`${WIRE_BAND}/MARK_FOR_DELETE`]: {
		label: "Mark For Delete",
		public: true,
		dispatcher: (signal: SignalDefinition, context: Context) =>
			markForDeleteOp(context),
	},
	[`${WIRE_BAND}/UNMARK_FOR_DELETE`]: {
		label: "Unmark For Delete",
		public: true,
		dispatcher: (signal: SignalDefinition, context: Context) =>
			unMarkForDeleteOp(context),
	},
	[`${WIRE_BAND}/CREATE_RECORD`]: {
		label: "Create Record",
		public: true,
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
	[`${WIRE_BAND}/CANCEL`]: {
		label: "Cancel",
		public: true,
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
		label: "Empty",
		public: true,
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
	[`${WIRE_BAND}/TOGGLE_CONDITION`]: {
		dispatcher: (signal: ToggleConditionSignal, context: Context) =>
			toggleConditionOp(context, signal.wire, signal.condition),
	},
	[`${WIRE_BAND}/LOAD`]: {
		dispatcher: (
			signal: LoadWiresSignal,
			context: Context
		): AppThunk<Promise<Context>> => async (
			dispatch: Dispatcher<AnyAction>
		) => {
			await dispatch(loadWiresOp({ context, wires: signal.wires }))
			return context
		},
	},
	[`${WIRE_BAND}/SAVE`]: {
		dispatcher: (
			signal: SaveWiresSignal,
			context: Context
		): AppThunk<Promise<Context>> => async (
			dispatch: Dispatcher<AnyAction>
		) => {
			await dispatch(saveWiresOp({ context, wires: signal.wires }))
			return context
		},
	},
}
