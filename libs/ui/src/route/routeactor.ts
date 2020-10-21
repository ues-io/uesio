import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import RouteState from "../store/types/routestate"
import { ActorAction } from "../store/actions/actions"
import { ThunkFunc } from "../store/store"
import { SignalDefinition } from "../definition/signal"

class RouteActor extends Actor {
	constructor() {
		super()
	}

	receiveAction(action: ActorAction, state: RuntimeState): RuntimeState {
		return state
	}

	receiveSignal(signal: SignalDefinition): ThunkFunc {
		throw new Error("No Handler found for signal: " + signal.signal)
	}

	// Serializes this wire into a redux state
	toState(): RouteState {
		return {
			viewname: "",
			viewnamespace: "",
			params: {},
			namespace: "",
			path: "",
		}
	}

	getId(): string {
		return ""
	}
}

export { RouteActor }
