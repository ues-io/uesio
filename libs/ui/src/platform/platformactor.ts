import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import { ActorAction } from "../store/actions/actions"
import { StateFragment } from "../definition/definition"
import { ThunkFunc } from "../store/store"
import { SignalDefinition } from "../definition/signal"

class PlatformActor extends Actor {
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
	toState(): StateFragment {
		return {}
	}

	getId(): string {
		return ""
	}
}

export default PlatformActor
