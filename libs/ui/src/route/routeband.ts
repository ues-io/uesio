import RuntimeState from "../store/types/runtimestate"

import { BandAction, ActionGroup } from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { ThunkFunc } from "../store/store"
import { RouteActor } from "./routeactor"
import RouteState from "../store/types/routestate"
import { SET_ROUTE, SetRouteAction } from "./routeactions"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"

const ROUTE_BAND = "route"

class RouteBand {
	static actionGroup: ActionGroup = {
		[SET_ROUTE]: (
			action: SetRouteAction,
			state: RouteState
		): RouteState => {
			return {
				...state,
				viewname: action.data.name,
				viewnamespace: action.data.namespace,
				params: action.data.params,
				workspace: action.data.workspace,
				theme: action.data.theme,
			}
		},
	}

	static getSignalHandlers(): SignalsHandler {
		return {}
	}

	static receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc {
		const handlers = RouteBand.getSignalHandlers()
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
				route: handler(action, state.route, state),
			})
		}
		return state
	}

	static getActor(): RouteActor {
		return new RouteActor()
	}

	static getSignalProps(/*signal: SignalDefinition*/): PropDescriptor[] {
		return []
	}
}

export { RouteBand, ROUTE_BAND }
