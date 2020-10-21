import RuntimeState from "../store/types/runtimestate"
import { StateFragment, StateMap } from "../definition/definition"
import { ActorAction } from "../store/actions/actions"
import { SignalDefinition } from "../definition/signal"
import { ThunkFunc } from "../store/store"
import { Context } from "../context/context"

type ActorType = "collection" | "view" | "viewdef"

type StateUpdate = [ActorType, StateMap]

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

	static assignState(
		actorType: ActorType,
		state: RuntimeState,
		actorStates: StateMap
	): RuntimeState {
		return this.assignStates([[actorType, actorStates]], state)
	}

	static assignStates(
		updates: StateUpdate[],
		state: RuntimeState
	): RuntimeState {
		const updateObj = updates.reduce((acc, update) => {
			const [actorType, actorStates] = update
			return {
				...acc,
				[actorType]: { ...state[actorType], ...actorStates },
			}
		}, {})

		return { ...state, ...updateObj }
	}

	static assignStateItem<T>(update: Partial<T>, existing: T): T {
		return { ...existing, ...update }
	}
}

export default Actor
