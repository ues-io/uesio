import RuntimeState from "../../store/types/runtimestate"
import { View, PlainViewMap } from "../../view/view"
import {
	BandAction,
	BAND,
	ActionGroup,
	StoreAction,
	ACTOR,
} from "../../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../../definition/signal"
import { SignalAPI } from "../../hooks/signalapi"
import { ThunkFunc, Dispatcher, DispatchReturn } from "../../store/store"
import { ADD_WIRES } from "../wire/actions"
import { LoadSignal, LOAD } from "./signals"
import { ADD_VIEW, AddViewAction } from "./actions"
import { PropDescriptor } from "../../buildmode/buildpropdefinition"
import { Context } from "../../context/context"
import { WIRE_BAND } from "../wire/band"
import { SET_LOADED, SET_PARAMS } from "../../view/viewactions"
import loadViewDef from "../viewdef/operations/load"

const VIEW_BAND = "view"

class ViewBand {
	static actionGroup: ActionGroup = {
		[ADD_VIEW]: (
			action: AddViewAction,
			state: PlainViewMap
		): PlainViewMap => {
			const namespace = action.data.namespace
			const name = action.data.name
			const path = action.data.path
			const params = action.data.params

			const viewId = ViewBand.makeId(namespace, name, path)
			return {
				...state,
				[viewId]: {
					...state[viewId],
					name,
					namespace,
					path,
					params,
					wires: {},
				},
			}
		},
	}

	static getSignalHandlers(): SignalsHandler {
		return {
			[LOAD]: {
				dispatcher: (
					signal: LoadSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<StoreAction>,
						getState: () => RuntimeState
					): DispatchReturn => {
						const namespace = signal.namespace
						const name = signal.name
						const state = getState()
						const viewDefId = `${namespace}.${name}`
						const viewId = ViewBand.makeId(
							namespace,
							name,
							signal.path
						)
						const viewDef = state.viewdef?.entities[viewDefId]
						const view = ViewBand.getActor(state, viewId)

						if (!view.valid) {
							dispatch({
								type: BAND,
								band: VIEW_BAND,
								name: ADD_VIEW,
								data: {
									namespace: namespace,
									name: name,
									path: signal.path,
									params: signal.params,
								},
							})
						} else {
							dispatch({
								type: ACTOR,
								band: VIEW_BAND,
								name: SET_PARAMS,
								target: viewId,
								data: {
									params: signal.params,
								},
							})
						}

						if (!viewDef) {
							await dispatch(
								loadViewDef({ context, namespace, name })
							)
						}

						await dispatch(
							async (
								dispatch: Dispatcher<StoreAction>,
								getState: () => RuntimeState
							): Promise<void> => {
								const state = getState()
								const viewDef =
									state.viewdef?.entities[viewDefId]

								if (viewDef) {
									const definition = viewDef.definition
									if (definition && definition.wires) {
										dispatch({
											type: BAND,
											band: WIRE_BAND,
											name: ADD_WIRES,
											data: definition.wires,
											view: viewId,
											target: "",
											targets: [],
										})
										await dispatch(
											async (
												dispatch: Dispatcher<
													StoreAction
												>,
												getState: () => RuntimeState
											): Promise<void> => {
												const view = ViewBand.getActor(
													getState(),
													viewId
												)
												const wires = view.source.wires
												const wireList = Object.keys(
													wires
												).map((wireId) => wireId)
												await SignalAPI.run(
													{
														signal: "LOAD",
														band: WIRE_BAND,
														targets: wireList,
													},
													context.addFrame({
														view: viewId,
													}),
													dispatch
												)
											}
										)
									}
									dispatch({
										type: ACTOR,
										name: SET_LOADED,
										band: VIEW_BAND,
										target: viewId,
									})
								}
							}
						)
						return context
					}
				},
			},
		}
	}

	static receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc {
		const handlers = ViewBand.getSignalHandlers()
		const handler = handlers && handlers[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	static receiveAction(
		action: BandAction,
		state: RuntimeState
	): RuntimeState {
		const handler = this.actionGroup[action.name]

		if (handler) {
			return Object.assign({}, state, {
				view: handler(action, state.view, state),
			})
		}
		return state
	}

	static getActor(state: RuntimeState, target?: string): View {
		return new View((target && state.view?.[target]) || null)
	}

	static makeId(namespace: string, name: string, path: string): string {
		return `${namespace}.${name}(${path})`
	}

	static getSignalProps(/*signal: SignalDefinition*/): PropDescriptor[] {
		return []
	}
}

export { ViewBand }
