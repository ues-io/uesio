import { Context } from "../../context/context"
import { PropDescriptor } from "../../buildmode/buildpropdefinition"
import toggleDeleteOp from "./operations/toggledelete"
import markForDeleteOp from "./operations/markfordelete"
import unMarkForDeleteOp from "./operations/unmarkfordelete"
import createRecordOp from "./operations/createrecord"
import updateRecordOp from "./operations/updaterecord"
import cancelWireOp from "./operations/cancel"
import emptyWireOp from "./operations/empty"
import toggleConditionOp from "./operations/togglecondition"
import loadWiresOp from "./operations/load"
import saveWiresOp from "./operations/save"
import { Dispatcher } from "../../store/store"
import { AnyAction } from "redux"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { WireDefinition } from "../../definition/wire"
import { WireConditionDefinition } from "./conditions/conditions"
import { Definition } from "../../definition/definition"
import { SaveResponseBatch } from "../../load/saveresponse"

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

interface ToggleConditionSignal extends SignalDefinition {
	wire: string
	condition: string
}

interface LoadWiresSignal extends SignalDefinition {
	wires?: string[]
}

interface SaveWiresSignal extends SignalDefinition {
	wires?: string[]
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
						def &&
							(<WireDefinition>def).conditions &&
							(<WireDefinition>def).conditions.length
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
	[`${WIRE_BAND}/LOAD`]: {
		label: "Load Wire(s)",
		dispatcher:
			(signal: LoadWiresSignal, context: Context) =>
			async (dispatch: Dispatcher<AnyAction>) => {
				await dispatch(loadWiresOp({ context, wires: signal.wires }))
				return context
			},
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
		dispatcher:
			(signal: SaveWiresSignal, context: Context) =>
			async (dispatch: Dispatcher<AnyAction>) => {
				const resp = await dispatch(
					saveWiresOp({ context, wires: signal.wires })
				)

				const batch = resp.payload as SaveResponseBatch

				// Special handling for saves of just one wire and one record
				if (batch.wires.length === 1) {
					const wire = batch.wires[0]
					const changes = wire.changes
					const changeKeys = Object.keys(changes)
					if (changeKeys.length === 1) {
						const [, name] = wire.wire.split("/")
						return context.addFrame({
							record: changeKeys[0],
							wire: name,
						})
					}
				}

				return context
			},
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
