import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import BuilderState from "../store/types/builderstate"
import { ActorAction, StoreAction } from "../store/actions/actions"
import { Dispatcher } from "../store/store"

class BuilderActor extends Actor {
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
	toState(): BuilderState {
		return {
			activeNode: "",
			selectedNode: "",
			buildMode: false,
			draggingNode: "",
			droppingNode: "",
			buildView: "",
			rightPanel: "",
			leftPanel: "",
			metadata: null,
			namespaces: null,
		}
	}

	getId(): string {
		return ""
	}
}

export { BuilderActor }
