import Actor from "../actor/actor"
import { LoadResponseRecord } from "../load/loadresponse"
import { LoadRequest } from "../load/loadrequest"
import RuntimeState from "../store/types/runtimestate"
import shortid from "shortid"
import { Collection, PlainCollection } from "../collection/collection"
import { PlainWireRecordMap, WireRecord, PlainWireRecord } from "./wirerecord"
import { PlainWireFieldMap, WireField } from "./wirefield"
import { Context } from "../context/context"
import { WireConditionState, getLoadRequestConditions } from "./wirecondition"
import {
	CREATE_RECORD,
	UPDATE_RECORD,
	SET_RECORD,
	CANCEL,
	MARK_FOR_DELETE,
	UNMARK_FOR_DELETE,
	TOGGLE_DELETE_STATUS,
	UnMarkForDeleteAction,
	MarkForDeleteAction,
	CancelAction,
	CreateRecordAction,
	UpdateRecordAction,
	ToggleConditionAction,
} from "./wireactions"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../store/store"
import {
	ACTOR,
	ActorAction,
	ActionGroup,
	StoreAction,
} from "../store/actions/actions"
import { SaveRequest } from "../load/saverequest"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import {
	ToggleDeleteStatusSignal,
	UnmarkForDeleteSignal,
	MarkForDeleteSignal,
	CreateRecordSignal,
	UpdateRecordSignal,
	CancelSignal,
	TOGGLE_CONDITION,
	ToggleConditionSignal,
	SetRecordSignal,
} from "./wiresignals"
import { WireType } from "../definition/wire"
import { PlainWireDefault } from "./wiredefault"
import { WireBand } from "./wireband"
import { PropDescriptor } from "../buildmode/buildpropdefinition"

type PlainWire = {
	name: string
	type: WireType
	collection: string
	fields: PlainWireFieldMap
	conditions: WireConditionState[]
	defaults: PlainWireDefault[]
	data: PlainWireRecordMap
	view: string
	original: PlainWireRecordMap
	changes: PlainWireRecordMap
	deletes: PlainWireRecordMap
	error?: string
}

type PlainWireMap = {
	[key: string]: PlainWire
}

class Wire extends Actor {
	constructor(source: PlainWire | null) {
		super()
		this.valid = !!source
		this.source = source || ({} as PlainWire)
	}

	static actionGroup: ActionGroup = {
		[CREATE_RECORD]: (
			signal: CreateRecordAction,
			state: PlainWire
		): PlainWire => {
			const newId = shortid.generate()
			return {
				...state,
				data: { ...state.data, [newId]: signal.data || {} },
				changes: { ...state.changes, [newId]: signal.data || {} },
			}
		},
		[UPDATE_RECORD]: (
			signal: UpdateRecordAction,
			state: PlainWire,
			allState: RuntimeState
		): PlainWire => {
			const collection = state.collection
			const collectionMetadata = allState.collection?.[collection]
			const idField = collectionMetadata?.idField
			if (!idField) {
				return state
			}
			return {
				...state,
				data: {
					...state.data,
					[signal.data.recordId]: {
						...state.data[signal.data.recordId],
						...signal.data.record,
					},
				},
				changes: {
					...state.changes,
					[signal.data.recordId]: {
						...state.changes[signal.data.recordId],
						...{
							...signal.data.record,
							[idField]:
								state.data[signal.data.recordId][idField],
						},
					},
				},
			}
		},
		// Set a record without setting "changes", also set originals to this value
		[SET_RECORD]: (
			signal: UpdateRecordAction,
			state: PlainWire,
			allState: RuntimeState
		): PlainWire => {
			const collection = state.collection
			const collectionMetadata = allState.collection?.[collection]
			const idField = collectionMetadata?.idField
			if (!idField) {
				return state
			}
			return Object.assign({}, state, {
				data: Object.assign({}, state.data, {
					[signal.data.recordId]: Object.assign(
						{},
						state.data[signal.data.recordId],
						signal.data.record
					),
				}),
				originals: Object.assign({}, state.changes, {
					[signal.data.recordId]: Object.assign(
						{},
						state.data[signal.data.recordId],
						signal.data.record
					),
				}),
			})
		},
		[CANCEL]: (action: CancelAction, state: PlainWire): PlainWire => {
			return {
				...state,
				data: {
					...state.original,
				},
				changes: {},
				deletes: {},
			}
		},
		[MARK_FOR_DELETE]: (
			action: MarkForDeleteAction,
			state: PlainWire,
			allState: RuntimeState
		): PlainWire => {
			const record = action.data.record
			const collection = state.collection
			const collectionMetadata = allState.collection?.[collection]
			const idField = collectionMetadata?.idField
			if (!record || !idField) {
				return state
			}
			return {
				...state,
				deletes: {
					...state.deletes,
					[record]: {
						[idField]: state.data[record][idField],
					},
				},
			}
		},
		[UNMARK_FOR_DELETE]: (
			action: UnMarkForDeleteAction,
			state: PlainWire
		): PlainWire => {
			const record = action.data.record
			if (!record) {
				return state
			}
			const {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				[record]: value,
				...newDeleteState
			} = state.deletes
			return {
				...state,
				deletes: newDeleteState,
			}
		},
		[TOGGLE_CONDITION]: (
			action: ToggleConditionAction,
			state: PlainWire
		): PlainWire => {
			const conditionIndex = state.conditions.findIndex(
				(condition) => condition.id === action.data.conditionId
			)
			if (!conditionIndex && conditionIndex !== 0) {
				return state
			}
			const oldCondition = state.conditions[conditionIndex]

			// modify existing array without mutation
			const newConditions = Object.assign([], state.conditions, {
				[conditionIndex]: {
					...oldCondition,
					active: !oldCondition.active,
				},
			})
			return {
				...state,
				conditions: newConditions,
			}
		},
	}

	static signalsHandler: SignalsHandler = {
		[CREATE_RECORD]: {
			label: "Create Record",
			public: true,
			properties: (): PropDescriptor[] => {
				return [
					{
						name: "target",
						type: "WIRE",
						label: "Target",
					},
				]
			},
			dispatcher: (
				signal: CreateRecordSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>,
					getState: () => RuntimeState
				): DispatchReturn => {
					const view = context.getView()
					if (view) {
						const state = getState()
						const viewId = view.getId()
						const wire = WireBand.getActor(
							state,
							signal.target,
							viewId
						)
						const defaults = wire.getDefaults()
						const defaultRecord: LoadResponseRecord = {}
						defaults.forEach((defaultItem) => {
							if (defaultItem.valueSource === "LOOKUP") {
								const lookupWire = WireBand.getActor(
									state,
									defaultItem.lookupWire,
									viewId
								)
								const lookupValue = defaultItem.lookupField
									? lookupWire
											.getFirstRecord()
											.getFieldValue(
												defaultItem.lookupField
											)
									: context.merge(defaultItem.lookupTemplate)
								if (lookupValue) {
									defaultRecord[
										defaultItem.field
									] = lookupValue
								}
							}
						})
						dispatch({
							type: ACTOR,
							band: signal.band,
							name: signal.signal,
							target: signal.target,
							scope: signal.scope,
							data: defaultRecord,
							view: viewId,
						})
					}
					return context
				}
			},
		},
		[UPDATE_RECORD]: {
			label: "Update Record",
			dispatcher: (
				signal: UpdateRecordSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: signal.signal,
						target: signal.target,
						scope: signal.scope,
						data: {},
						view: context.getView()?.getId(),
					})
					return context
				}
			},
		},
		[SET_RECORD]: {
			dispatcher: (
				signal: SetRecordSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: signal.signal,
						target: signal.target,
						scope: signal.scope,
						data: {},
						view: context.getView()?.getId(),
					})
					return context
				}
			},
		},
		[TOGGLE_CONDITION]: {
			dispatcher: (
				signal: ToggleConditionSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: signal.signal,
						target: signal.target,
						scope: signal.scope,
						data: {
							conditionId: signal.conditionId,
						},
						view: context.getView()?.getId(),
					})
					return context
				}
			},
		},
		[CANCEL]: {
			label: "Cancel",
			public: true,
			properties: (): PropDescriptor[] => {
				return [
					{
						name: "target",
						type: "WIRE",
						label: "Target",
					},
				]
			},
			dispatcher: (signal: CancelSignal, context: Context): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: signal.signal,
						target: signal.target,
						scope: signal.scope,
						data: {},
						view: context.getView()?.getId(),
					})
					return context
				}
			},
		},
		[MARK_FOR_DELETE]: {
			label: "Mark For Delete",
			public: true,
			dispatcher: (
				signal: MarkForDeleteSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					const record = context.getRecord()?.getId()
					if (!record || !signal.target) {
						return context
					}
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: MARK_FOR_DELETE,
						target: signal.target,
						data: {
							record,
						},
						view: context.getView()?.getId(),
					})
					return context
				}
			},
		},
		[UNMARK_FOR_DELETE]: {
			label: "Unmark For Delete",
			public: true,
			dispatcher: (
				signal: UnmarkForDeleteSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					const record = context.getRecord()?.getId()
					if (!record || !signal.target) {
						return context
					}
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: UNMARK_FOR_DELETE,
						target: signal.target,
						data: {
							record,
						},
						view: context.getView()?.getId(),
					})
					return context
				}
			},
		},
		[TOGGLE_DELETE_STATUS]: {
			label: "Toggle Delete Status",
			public: true,
			dispatcher: (
				signal: ToggleDeleteStatusSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					const record = context.getRecord()?.getId()
					const view = context.getView()
					if (!record || !signal.target || !view) {
						return context
					}
					const isDeleted =
						view.source.wires[signal.target].deletes[record]
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: isDeleted ? UNMARK_FOR_DELETE : MARK_FOR_DELETE,
						target: signal.target,
						data: {
							record,
						},
						view: context.getView()?.getId(),
					})
					return context
				}
			},
		},
	}

	source: PlainWire
	valid: boolean
	collection: Collection
	dispatcher: Dispatcher<StoreAction>

	receiveAction(action: ActorAction, state: RuntimeState): RuntimeState {
		const actionHandler = Wire.actionGroup[action.name]
		const target = this.getId()
		if (actionHandler && action.view && state.view) {
			state.view[action.view].wires = Object.assign(
				{},
				state.view[action.view].wires,
				{
					[target]: actionHandler(
						action,
						state.view[action.view].wires[target],
						state
					),
				}
			)
		}
		return state
	}

	receiveSignal(signal: SignalDefinition, context: Context): ThunkFunc {
		const handler = Wire.signalsHandler[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	// Serializes this wire into a redux state
	toState(): PlainWire {
		return { ...this.source }
	}

	getId(): string {
		return this.source.name
	}

	getType(): WireType {
		return this.source.type
	}

	getCollectionName(): string {
		return this.source.collection
	}

	getCollection(): Collection {
		return this.collection
	}

	isValid(): boolean {
		return this.valid
	}

	isMarkedForDeletion(recordId: string): boolean {
		return !!this.source.deletes[recordId]
	}

	getFieldsList(): WireField[] {
		return this.source?.fields
			? Object.keys(this.source.fields).map(
					(id) => new WireField(this.source.fields[id], id)
			  )
			: []
	}

	getData(): WireRecord[] {
		return this.source?.data
			? Object.keys(this.source.data).map((id) => this.getRecord(id))
			: []
	}

	getRecord(id: string): WireRecord {
		return new WireRecord(this.source.data[id], id, this)
	}

	getFirstRecord(): WireRecord {
		const recordId = Object.keys(this.source.data)[0]
		return this.getRecord(recordId)
	}

	getConditions(): WireConditionState[] {
		return this.source.conditions || []
	}

	getCondition(id: string): WireConditionState | null {
		return this.getConditions().find((c) => c.id === id) || null
	}

	getDefaults(): PlainWireDefault[] {
		return this.source.defaults || []
	}

	dispatchRecordUpdate(recordId: string, record: PlainWireRecord): void {
		this.dispatcher &&
			this.dispatcher({
				type: ACTOR,
				band: "wire",
				name: "UPDATE_RECORD",
				data: {
					recordId,
					record,
				},
				target: this.getId(),
				view: this.source.view,
			})
	}

	dispatchRecordSet(recordId: string, record: PlainWireRecord): void {
		this.dispatcher &&
			this.dispatcher({
				type: ACTOR,
				band: "wire",
				name: "SET_RECORD",
				data: {
					recordId,
					record,
				},
				target: this.getId(),
				view: this.source.view,
			})
	}

	attachCollection(collection: PlainCollection | null): Wire {
		this.collection = new Collection(collection)
		return this
	}

	attachDispatcher(dispatcher: Dispatcher<StoreAction>): Wire {
		this.dispatcher = dispatcher
		return this
	}

	getLoadRequest(context: Context): LoadRequest {
		return {
			wire: this.getId(),
			type: this.getType(),
			collection: this.getCollectionName(),
			fields:
				this.source.fields &&
				Object.keys(this.source.fields).map((fieldName) => ({
					...this.source.fields[fieldName],
					id: fieldName,
				})),
			conditions: getLoadRequestConditions(this.getConditions(), context),
		}
	}

	getSaveRequest(): SaveRequest {
		return {
			wire: this.getId(),
			collection: this.getCollectionName(),
			changes: this.source.changes,
			deletes: this.source.deletes,
		}
	}
}

export { Wire, PlainWire, PlainWireMap }
