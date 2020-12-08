import { Context } from "../../context/context"
import { BandSignal } from "../../definition/signal"
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
import { AnyAction } from "redux"

// The key for the entire band
const WIRE_BAND = "wire"

interface CreateRecordSignal extends BandSignal {
	wire: string
}

interface CancelWireSignal extends BandSignal {
	wire: string
}

interface EmptyWireSignal extends BandSignal {
	wire: string
}

interface ToggleConditionSignal extends BandSignal {
	wire: string
	condition: string
}

interface LoadWiresSignal extends BandSignal {
	wires: string[]
}

interface SaveWiresSignal extends BandSignal {
	wires: string[]
}

// "Signal Handlers" for all of the signals in the band
const signals = {
	[`${WIRE_BAND}/TOGGLE_DELETE_STATUS`]: {
		label: "Toggle Delete Status",
		public: true,
		dispatcher: (signal: BandSignal, context: Context) =>
			toggleDeleteOp(context),
	},
	[`${WIRE_BAND}/MARK_FOR_DELETE`]: {
		label: "Mark For Delete",
		public: true,
		dispatcher: (signal: BandSignal, context: Context) =>
			markForDeleteOp(context),
	},
	[`${WIRE_BAND}/UNMARK_FOR_DELETE`]: {
		label: "Unmark For Delete",
		public: true,
		dispatcher: (signal: BandSignal, context: Context) =>
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
		dispatcher: (signal: LoadWiresSignal, context: Context) => async (
			dispatch: Dispatcher<AnyAction>
		) => {
			await dispatch(loadWiresOp({ context, wires: signal.wires }))
			return context
		},
	},
	[`${WIRE_BAND}/SAVE`]: {
		dispatcher: (signal: SaveWiresSignal, context: Context) => async (
			dispatch: Dispatcher<AnyAction>
		) => {
			await dispatch(saveWiresOp({ context, wires: signal.wires }))
			return context
		},
	},
}

export default signals
