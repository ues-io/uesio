import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import { ActorAction, StoreAction } from "../store/actions/actions"
import { Dispatcher } from "../store/store"

class Bot extends Actor {
	constructor() {
		super()
	}

	receiveAction(action: ActorAction, state: RuntimeState): RuntimeState {
		return state
	}

	receiveSignal(): Dispatcher<StoreAction> {
		return (): Promise<void> => Promise.resolve()
	}

	// Serializes this wire into a redux state
	toState(): null {
		return null
	}

	getId(): string {
		return ""
	}
}

export { Bot }
