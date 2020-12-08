import RuntimeState from "../store/types/runtimestate"
import { View, PlainViewMap } from "./view"
import {
	BandAction,
	BAND,
	ActionGroup,
	StoreAction,
	ACTOR,
} from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { ThunkFunc, Dispatcher, DispatchReturn } from "../store/store"
import { LoadSignal, LOAD } from "./viewbandsignals"
import { ADD_VIEW, AddViewAction } from "./viewbandactions"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"
import { SET_LOADED, SET_PARAMS } from "./viewactions"
import loadViewDef from "../bands/viewdef/operations/load"
import loadWires from "../bands/wire/operations/load"
import { selectors as viewDefSelectors } from "../bands/viewdef"

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
				},
			}
		},
	}

	static getSignalHandlers = (): SignalsHandler => ({
		[LOAD]: {
			dispatcher: (
				signal: LoadSignal,
				context: Context
			): ThunkFunc => async (
				dispatch: Dispatcher<StoreAction>,
				getState: () => RuntimeState
			): DispatchReturn => {
				const namespace = signal.namespace
				const name = signal.name
				const viewDefId = `${namespace}.${name}`
				const viewId = ViewBand.makeId(namespace, name, signal.path)
				const view = ViewBand.getActor(getState(), viewId)

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

				if (!viewDefSelectors.selectById(getState(), viewDefId)) {
					await dispatch(loadViewDef({ context, namespace, name }))
				}

				const viewDef = viewDefSelectors.selectById(
					getState(),
					viewDefId
				)

				if (!viewDef) return context

				const wires = viewDef.definition?.wires
				if (wires) {
					await dispatch(
						loadWires({
							context: context.addFrame({
								view: viewId,
							}),
							wires: Object.keys(wires),
						})
					)
				}
				dispatch({
					type: ACTOR,
					name: SET_LOADED,
					band: VIEW_BAND,
					target: viewId,
				})

				return context
			},
		},
	})

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
