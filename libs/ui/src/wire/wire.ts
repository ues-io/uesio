import Actor from "../actor/actor"
import { LoadResponseRecord } from "../load/loadresponse"
import { LoadRequest, LoadRequestField } from "../load/loadrequest"
import RuntimeState from "../store/types/runtimestate"
import shortid from "shortid"
import { PlainCollection } from "../bands/collection/types"
import Collection from "../bands/collection/class"
import { PlainWireRecordMap, WireRecord, PlainWireRecord } from "./wirerecord"
import { PlainWireFieldMap, WireField } from "./wirefield"
import { Context } from "../context/context"
import { WireConditionState, getLoadRequestConditions } from "./wirecondition"
import {
	CREATE_RECORD,
	UPDATE_RECORD,
	SET_RECORD,
	CANCEL,
	EMPTY,
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
import { Dispatcher, DispatchReturn, getStore, ThunkFunc } from "../store/store"
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
	EmptySignal,
} from "./wiresignals"
import { WireDefault } from "./wiredefault"
import { WireBand } from "../bands/wire/band"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { wire } from "@uesio/constants"

type PlainWire = {
	name: string
	type: wire.WireType
	collection: string
	fields: PlainWireFieldMap
	conditions: WireConditionState[]
	defaults: WireDefault[]
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
			action: CreateRecordAction,
			state: PlainWire
		): PlainWire => {
			const newId = action.id
			return {
				...state,
				data: { ...state.data, [newId]: action.data || {} },
				changes: { ...state.changes, [newId]: action.data || {} },
			}
		},
		[UPDATE_RECORD]: (
			action: UpdateRecordAction,
			state: PlainWire,
			allState: RuntimeState
		): PlainWire => {
			const collection = state.collection
			const collectionMetadata = allState.collection?.[collection]
			const idField = collectionMetadata?.idField
			const data = action.data
			const { record, recordId } = data
			if (!idField) {
				return state
			}
			return {
				...state,
				data: {
					...state.data,
					[recordId]: {
						...state.data[recordId],
						...record,
					},
				},
				changes: {
					...state.changes,
					[recordId]: {
						...state.changes[recordId],
						...{
							...record,
							[idField]: state.data[recordId][idField],
						},
					},
				},
			}
		},
		// Set a record without setting "changes", also set original to this value
		[SET_RECORD]: (
			action: UpdateRecordAction,
			state: PlainWire,
			allState: RuntimeState
		): PlainWire => {
			const collection = state.collection
			const collectionMetadata = allState.collection?.[collection]
			const idField = collectionMetadata?.idField
			const data = action.data
			const { record, recordId } = data
			if (!idField) {
				return state
			}
			return {
				...state,
				data: {
					...state.data,
					[recordId]: {
						...state.data[recordId],
						...record,
					},
				},
				original: {
					...state.changes,
					[recordId]: {
						...state.data[recordId],
						...record,
					},
				},
			}
		},
		[CANCEL]: (action: CancelAction, state: PlainWire): PlainWire => {
			return {
				...state,
				data: {
					...(state?.original ? state.original : {}),
				},
				changes: {},
				deletes: {},
			}
		},
		[EMPTY]: (action: CancelAction, state: PlainWire): PlainWire => {
			return {
				...state,
				data: {},
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
					const viewId = context.getViewId()
					if (!viewId) {
						return context
					}
					const state = getState()
					const wire = WireBand.getActor(state, signal.target, viewId)
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
										.getFieldValue(defaultItem.lookupField)
								: context.merge(defaultItem.lookupTemplate)
							if (lookupValue) {
								defaultRecord[defaultItem.field] = lookupValue
							}
						}
						if (defaultItem.valueSource === "VALUE") {
							const value = context.merge(defaultItem.value)
							if (value) {
								defaultRecord[defaultItem.field] = value
							}
						}
					})
					const recordId = shortid.generate()
					dispatch({
						type: ACTOR,
						band: signal.band,
						name: signal.signal,
						target: signal.target,
						scope: signal.scope,
						data: defaultRecord,
						id: recordId,
						view: viewId,
					})

					return context.addFrame({
						record: recordId,
						wire: wire.getId(),
					})
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
		[EMPTY]: {
			label: "Empty",
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
			dispatcher: (signal: EmptySignal, context: Context): ThunkFunc => {
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

	getType(): wire.WireType {
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

	getViewId(): string {
		return this.source?.view
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

	getDefaults(): WireDefault[] {
		return this.source.defaults || []
	}

	dispatchRecordUpdate(recordId: string, record: PlainWireRecord): void {
		getStore().dispatch({
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
		getStore().dispatch({
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

	getLoadRequest(context: Context): LoadRequest {
		return {
			wire: this.getId(),
			type: this.getType(),
			collection: this.getCollectionName(),
			fields: getFieldsRequest(this.source.fields) || [],
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

function getFieldsRequest(
	fields?: PlainWireFieldMap
): LoadRequestField[] | undefined {
	if (!fields) {
		return undefined
	}
	return Object.keys(fields).map((fieldName) => {
		const fieldData = fields[fieldName]
		const subFields = getFieldsRequest(fieldData?.fields)
		return {
			fields: subFields,
			id: fieldName,
		}
	})
}

export { Wire, PlainWire, PlainWireMap }
