import { Platform } from "../platform/platform"
import { LoadResponseBatch, LoadResponse } from "../load/loadresponse"
import { LoadRequestBatch } from "../load/loadrequest"
import RuntimeState from "../store/types/runtimestate"

import { Wire, PlainWireMap, PlainWire } from "./wire"
import {
	ADD_WIRES,
	SAVE,
	LOAD,
	LoadAction,
	SaveAction,
	AddWiresAction,
	ADD_ERRORS,
	AddErrorsAction,
} from "./wirebandactions"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../store/store"
import { SaveResponseBatch, SaveResponse } from "../load/saveresponse"
import { SaveRequestBatch } from "../load/saverequest"
import { PlainWireRecordMap } from "./wirerecord"
import {
	BandAction,
	ActionGroup,
	StoreAction,
	BAND,
} from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { SignalAPI } from "../hooks/signalapi"
import { batch } from "react-redux"
import { SaveSignal, LoadSignal, AddWiresSignal } from "./wirebandsignals"
import { CREATE_RECORD, EMPTY } from "./wireactions"
import { Context } from "../context/context"
import shortid from "shortid"
import { deleteProperty } from "../util/util"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { getInitializedConditions } from "./wirecondition"

const WIRE_BAND = "wire"

class WireBand {
	static actionGroup: ActionGroup = {
		[SAVE]: (action: SaveAction, state: PlainWireMap): PlainWireMap => {
			// TODO: This is definitely the wrong way to do this.
			// I think you could accomplish this with a single assign statement.
			if (action.data.wires) {
				action.data.wires.forEach((wire: SaveResponse) => {
					Object.keys(wire.changeResults).forEach((tempId) => {
						state = Object.assign({}, state, {
							[wire.wire]: Object.assign({}, state[wire.wire], {
								data: Object.assign({}, state[wire.wire].data, {
									[tempId]: Object.assign(
										{},
										state[wire.wire].data[tempId],
										wire.changeResults[tempId].data
									),
								}),
								changes: {},
								original: Object.assign(
									{},
									state[wire.wire].data,
									{
										[tempId]: Object.assign(
											{},
											state[wire.wire].data[tempId],
											wire.changeResults[tempId].data
										),
									}
								),
							}),
						})
					})
					Object.keys(wire.deleteResults).forEach((tempId) => {
						const newData: PlainWireRecordMap = {}
						const newOriginal: PlainWireRecordMap = {}
						Object.keys(state[wire.wire].data)
							.filter((recordId) => recordId !== tempId)
							.forEach((recordId) => {
								newData[recordId] =
									state[wire.wire].data[recordId]
								newOriginal[recordId] =
									state[wire.wire].data[recordId]
							})
						state = Object.assign({}, state, {
							[wire.wire]: Object.assign({}, state[wire.wire], {
								data: newData,
								original: newOriginal,
							}),
						})
					})

					// Remove errors on a successful save
					state = Object.assign({}, state, {
						[wire.wire]: Object.assign({}, state[wire.wire], {
							error: null,
						}),
					})
				})
			}
			return state
		},
		[LOAD]: (action: LoadAction, state: PlainWireMap): PlainWireMap => {
			return {
				...state,
				...WireBand.hydrate(state, action.data.responses),
			}
		},
		[ADD_WIRES]: (
			action: AddWiresAction,
			state: PlainWireMap
		): PlainWireMap => {
			const wireMap: PlainWireMap = {}
			const defs = action.data
			Object.keys(defs).forEach((key) => {
				const def = defs[key]
				const existing = state[key]
				wireMap[key] = def && {
					name: key,
					view: action.view,
					type: def.type || "QUERY",
					collection: def.collection,
					fields: def.fields,
					conditions: getInitializedConditions(def.conditions),
					defaults: def.defaults,
					data: existing ? existing.data : {},
					original: existing ? existing.original : {},
					changes: existing ? existing.changes : {},
					deletes: existing ? existing.deletes : {},
				}
			})
			return { ...state, ...wireMap }
		},
		[ADD_ERRORS]: (
			action: AddErrorsAction,
			state: PlainWireMap
		): PlainWireMap => {
			const wireMap = action.data.targets.reduce(
				(acc, target) => ({
					...acc,
					[target]: {
						...state[target],
						error: action.data.error,
					},
				}),
				{}
			)

			return { ...state, ...wireMap }
		},
	}

	static signalsHandler: SignalsHandler = {
		[ADD_WIRES]: {
			dispatcher: (
				signal: AddWiresSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>
				): DispatchReturn => {
					const view = context.getView()
					if (view) {
						const viewId = view.getId()
						dispatch({
							type: BAND,
							band: signal.band,
							name: signal.signal,
							data: signal.defs,
							view: viewId,
						})
					}
					return context
				}
			},
		},
		[SAVE]: {
			label: "Save Wire",
			public: true,
			properties: (): PropDescriptor[] => {
				return [
					{
						name: "targets",
						type: "WIRES",
						label: "Targets",
					},
				]
			},
			dispatcher: (signal: SaveSignal, context: Context): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>,
					getState: () => RuntimeState,
					platform: Platform
				): DispatchReturn => {
					const view = context.getView()
					if (signal.targets && signal.targets.length && view) {
						const viewId = view.getId()
						const wires = view.source.wires
						const wiresToSave = signal.targets
							// Don't save null wires
							.filter((wireId) => wires[wireId])
						const wireList = wiresToSave.map(
							(wireId) => new Wire(wires[wireId])
						)
						const response = await WireBand.save(
							wireList,
							context,
							platform
						).catch((err) => {
							dispatch({
								type: BAND,
								band: signal.band,
								name: ADD_ERRORS,
								data: {
									error: err.message,
									targets: wiresToSave,
								},
								view: viewId,
							})
						})

						if (response) {
							dispatch({
								type: BAND,
								band: signal.band,
								name: signal.signal,
								data: response,
								view: viewId,
							})
						}
					}
					return context
				}
			},
		},

		[LOAD]: {
			label: "Load Wire",
			public: true,
			properties: (): PropDescriptor[] => {
				return [
					{
						name: "targets",
						type: "WIRES",
						label: "Targets",
					},
				]
			},
			dispatcher: (signal: LoadSignal, context: Context): ThunkFunc => {
				return async (
					dispatch: Dispatcher<StoreAction>,
					getState: () => RuntimeState,
					platform: Platform
				): DispatchReturn => {
					const view = context.getView()
					if (signal.targets && signal.targets.length && view) {
						const viewId = view.getId()
						const wires = view.source.wires
						const wiresToLoad = signal.targets
							// Don't load null wires
							.filter((wireId) => wires[wireId])
						const wireList = wiresToLoad.map(
							(wireId) => new Wire(wires[wireId])
						)
						const response = await WireBand.load(
							wireList,
							context,
							platform
						).catch((err) => {
							dispatch({
								type: BAND,
								band: signal.band,
								name: ADD_ERRORS,
								data: {
									error: err.message,
									targets: wiresToLoad,
								},
								view: viewId,
							})
						})

						if (!response) {
							return context
						}

						batch(() => {
							dispatch({
								type: BAND,
								band: signal.band,
								name: signal.signal,
								data: {
									responses: response.wires,
									targets: signal.targets,
								},
								view: viewId,
							})
							// Dispatch the metadata change to the collection band
							dispatch({
								type: BAND,
								band: "collection",
								name: signal.signal,
								data: {
									collections: response.collections,
								},
								view: viewId,
							})
						})

						for (const wire of wireList) {
							if (wire.getType() === "CREATE") {
								await SignalAPI.run(
									{
										band: WIRE_BAND,
										signal: EMPTY,
										target: wire.getId(),
									},
									context,
									dispatch
								)
								await SignalAPI.run(
									{
										band: WIRE_BAND,
										signal: CREATE_RECORD,
										target: wire.getId(),
									},
									context,
									dispatch
								)
							}
						}
					}
					return context
				}
			},
		},
	}

	// Makes a load request and actually performs the platform's load functionality
	static async load(
		wires: Wire[],
		context: Context,
		platform: Platform
	): Promise<LoadResponseBatch> {
		const requestBody = this.getLoadRequests(wires, context)
		return platform.loadData(context, requestBody)
	}

	// Makes a save request and actually performs the platform's save functionality
	static async save(
		wires: Wire[],
		context: Context,
		platform: Platform
	): Promise<SaveResponseBatch> {
		const requestBody = this.getSaveRequests(wires)
		return platform.saveData(context, requestBody)
	}

	// Builds a load request batch from a list of wires
	static getLoadRequests(wires: Wire[], context: Context): LoadRequestBatch {
		return {
			wires: wires.map((wire) => wire.getLoadRequest(context)),
		}
	}

	// Builds a save request batch from a list of wires
	static getSaveRequests(wires: Wire[]): SaveRequestBatch {
		return {
			wires: wires.map((wire) => wire.getSaveRequest()),
		}
	}

	static receiveAction(
		action: BandAction,
		state: RuntimeState
	): RuntimeState {
		const actionHandler = this.actionGroup[action.name]

		if (actionHandler && action.view && state.view) {
			return Object.assign({}, state, {
				view: Object.assign({}, state.view, {
					[action.view]: Object.assign({}, state.view[action.view], {
						wires: actionHandler(
							action,
							state.view[action.view].wires,
							state
						),
					}),
				}),
			})
		}
		return state
	}

	static receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc {
		const handler = this.signalsHandler[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	static getSignalProps(signal: SignalDefinition): PropDescriptor[] {
		const handlers = {
			...Wire.signalsHandler,
			...this.signalsHandler,
		}
		const signalOptions = Object.keys(handlers).flatMap((key: string) => {
			const handler = handlers[key]
			if (!handler?.public) return []
			return [
				{
					value: key,
					label: handler.label || key,
				},
			]
		})
		const handler = handlers[signal.signal]

		const signalProp: PropDescriptor[] = [
			{
				name: "signal",
				type: "SELECT",
				label: "Signal",
				options: signalOptions,
			},
		]

		if (handler && handler.public && handler.properties) {
			return signalProp.concat(handler.properties(signal))
		}
		return signalProp
	}

	static hydrate(
		existingWires: PlainWireMap,
		loadResponses: LoadResponse[]
	): PlainWireMap {
		const hydratedWires: PlainWireMap = {}
		if (loadResponses) {
			loadResponses.forEach((response) => {
				const data: PlainWireRecordMap = {}
				const original: PlainWireRecordMap = {}
				response.data.forEach((item) => {
					const localId = shortid.generate()
					data[localId] = item
					original[localId] = item
				})
				const existingWire: PlainWire = deleteProperty(
					Object.assign({}, existingWires[response.wire], {
						data,
						original,
					}),
					"error"
				)

				hydratedWires[response.wire] = existingWire
			})
		}
		return hydratedWires
	}

	static getActor(state: RuntimeState, target?: string, view?: string): Wire {
		return new Wire(
			(target && view && state.view?.[view]?.wires[target]) || null
		)
	}
}

export { WireBand, WIRE_BAND }
