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
import { RegularWireDefinition, WireDefinition } from "../../definition/wire"

import { WireConditionState } from "./conditions/conditions"
import { MetadataKey } from "../builder/types"

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
	value: string
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

interface LoadWiresSignal extends SignalDefinition {
	wires?: string[]
}
interface InitializeWiresSignal extends SignalDefinition {
	wireDefs: Record<string, WireDefinition> | string[]
}

interface SaveWiresSignal extends SignalDefinition {
	wires?: string[]
}

interface SearchWireSignal extends SignalDefinition {
	wire: string
	search: string
	searchFields?: string[]
}

const getWiresWith = (key: "conditions" | "order") =>
	({
		name: "wire",
		type: "WIRE",
		filter: (def: RegularWireDefinition) => def && !!def[key]?.length,
		label: "Wire",
	} as PropDescriptor)

const getConditionIdsDescriptor = (wire: string): PropDescriptor => ({
	name: "conditionId",
	type: "CONDITION",
	filter: (def: WireConditionState) => !!def.id,
	wire,
	label: "condition",
})

const getWireAndConditionsDescriptor = (wire: string) => [
	getWiresWith("conditions"),
	getConditionIdsDescriptor(wire),
]

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${WIRE_BAND}/TOGGLE_DELETE_STATUS`]: {
		label: "Toggle delete status",
		description: "Toggle the delete status of a wire",
		dispatcher: (signal: SignalDefinition, context: Context) =>
			toggleDeleteOp(context),
		properties: () => [],
	},
	[`${WIRE_BAND}/MARK_FOR_DELETE`]: {
		label: "Mark For Delete",
		description: "Mark for delete",
		dispatcher: (signal: SignalDefinition, context: Context) =>
			markForDeleteOp(context),
		properties: () => [],
	},
	[`${WIRE_BAND}/UNMARK_FOR_DELETE`]: {
		label: "Unmark For Delete",
		description: "Unmark for delete",
		dispatcher: (signal: SignalDefinition, context: Context) =>
			unMarkForDeleteOp(context),
		properties: () => [],
	},
	[`${WIRE_BAND}/CREATE_RECORD`]: {
		label: "Create Record",
		description: "Creates a new record on a wire",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
		],
		dispatcher: (signal: CreateRecordSignal, context: Context) =>
			createRecordOp(context, signal.wire, signal.prepend),
	},
	[`${WIRE_BAND}/UPDATE_RECORD`]: {
		label: "Update Record",
		description: "update record",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "field",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
			{
				name: "value",
				type: "TEXT",
				label: "Value",
			},
		],
		dispatcher: (signal: UpdateRecordSignal, context: Context) =>
			updateRecordOp(
				context,
				[signal.field],
				context.merge(signal.value)
			),
	},
	[`${WIRE_BAND}/CANCEL`]: {
		label: "Cancel Wire Changes",
		description: "Cancel all wire changes",
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
		description: "Empty wire",
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
		description: "Reset wire",
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
		description: "Search wire",
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "searchFields",
				type: "FIELDS",
				label: "Search Fields",
				wireField: "wire",
			},
			{
				name: "search",
				type: "TEXT",
				label: "Search",
			},
		],
		dispatcher: (signal: SearchWireSignal, context: Context) =>
			searchWireOp(
				context,
				signal.wire,
				signal.search,
				signal?.searchFields
			),
	},
	[`${WIRE_BAND}/TOGGLE_CONDITION`]: {
		label: "Toggle Wire Condition",
		description: "Toggle wire condition",
		dispatcher: (signal: ToggleConditionSignal, context: Context) =>
			toggleConditionOp(context, signal.wire, signal.conditionId),
		properties: (signal: SignalDefinition): PropDescriptor[] => [
			...getWireAndConditionsDescriptor(<string>signal.wire),
		],
	},

	[`${WIRE_BAND}/SET_CONDITION_VALUE`]: {
		label: "Set Wire Condition value",
		description: "Set the value of the wire condition",
		dispatcher: (signal: SetConditionValueSignal, context: Context) =>
			setConditionValueOp(
				context,
				signal.wire,
				signal.conditionId,
				signal.value
			),
		properties: (signal): PropDescriptor[] => [
			...getWireAndConditionsDescriptor(<string>signal.wire),
			{
				name: "value",
				type: "TEXT",
				label: "value",
			},
		],
	},
	[`${WIRE_BAND}/SET_CONDITION`]: {
		label: "Set Wire Condition",
		description: "Set wire condition",
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
		description: "Remove wire condition",
		dispatcher: (signal: RemoveConditionSignal, context: Context) =>
			removeConditionOp(context, signal.wire, signal.conditionId),
		properties: (signal: SignalDefinition): PropDescriptor[] => [
			...getWireAndConditionsDescriptor(<string>signal.wire),
		],
	},
	[`${WIRE_BAND}/SET_ORDER`]: {
		label: "Set Wire Order",
		description: "Removes previous order and sets the new one",
		dispatcher: (signal: SetOrderSignal, context: Context) =>
			setOrderOp(context, signal.wire, signal.order),
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "field",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
			{
				name: "desc",
				type: "BOOLEAN",
				label: "Descending",
			},
		],
	},
	[`${WIRE_BAND}/ADD_ORDER`]: {
		label: "Add Wire Order",
		description: "appends new order to the wire",
		dispatcher: (signal: AddOrderSignal, context: Context) =>
			addOrderOp(context, signal.wire, signal.field, signal.desc),
		properties: (): PropDescriptor[] => [
			{
				name: "wire",
				type: "WIRE",
				label: "Wire",
			},
			{
				name: "field",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
			{
				name: "desc",
				type: "BOOLEAN",
				label: "Descending",
			},
		],
	},
	[`${WIRE_BAND}/REMOVE_ORDER`]: {
		label: "Remove Wire Order",
		description: "Remove wire order",
		dispatcher: (signal: RemoveOrderSignal, context: Context) =>
			removeOrderOp(context, signal.wire, signal.fields),
		properties: (): PropDescriptor[] => [
			getWiresWith("order"),
			{
				name: "fields",
				type: "FIELD",
				label: "Field",
				wireField: "wire",
			},
		],
	},
	[`${WIRE_BAND}/INIT`]: {
		label: "Init Wire(s)",
		description: "Init wire(s)",
		dispatcher: (signal: InitializeWiresSignal, context: Context) => {
			const wireDefs: Record<string, WireDefinition | undefined> =
				Array.isArray(signal.wireDefs)
					? Object.fromEntries(
							signal.wireDefs.map((wirename) => [
								wirename,
								undefined,
							])
					  )
					: signal.wireDefs

			return initWiresOp(context, wireDefs)
		},
		properties: (): PropDescriptor[] => [
			{
				name: "wires",
				type: "WIRES",
				label: "Wires",
			},
		],
	},
	[`${WIRE_BAND}/LOAD`]: {
		label: "Load Wire(s)",
		description: "Load wire(s)",
		dispatcher: (signal: LoadWiresSignal, context: Context) =>
			loadWiresOp(context, signal.wires, true),
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
		description: "Load next batch",
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
		description: "Load all",
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
		description: "Save wire(s)",
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
