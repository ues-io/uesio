import RuntimeState from "../store/types/runtimestate"
import { StateFragment } from "../definition/definition"
import { ActorAction } from "../store/actions/actions"
import { SignalDefinition } from "../definition/signal"
import { ThunkFunc } from "../store/store"
import { Context } from "../context/context"

abstract class Actor {
	abstract receiveAction(
		action: ActorAction,
		state: RuntimeState
	): RuntimeState
	abstract receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc

	// Serializes this actor into a redux state
	abstract toState(): StateFragment

	// Returns the id of this actor
	abstract getId(): string
}

export default Actor
