import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"

import { ThunkFunc } from "../store/store"
import {
	SET_DEFAULT_STATE,
	SetDefaultStateAction,
	ComponentAction,
	ComponentSignal,
} from "./componentactions"
import { SignalHandlerStore, SignalsHandler } from "../definition/signal"
import { ActionGroupStore, ActionGroup } from "../store/actions/actions"
import { Context } from "../context/context"

type PlainComponentState = {
	[key: string]: string | boolean | number
}

type PlainComponentStateMap = {
	[key: string]: PlainComponentState
}

const INTERNAL_SCOPE = "internal"

class ComponentActor extends Actor {
	constructor(source: PlainComponentState | null) {
		super()
		this.valid = !!source
		this.source = source || ({} as PlainComponentState)
	}

	static signalHandlers: SignalHandlerStore = {}

	static actionReducers: ActionGroupStore = {
		[INTERNAL_SCOPE]: {
			[SET_DEFAULT_STATE]: (
				action: SetDefaultStateAction
			): PlainComponentState => {
				return action.data.defaultState
			},
		},
	}

	source: PlainComponentState
	valid: boolean

	receiveSignal(signal: ComponentSignal, context: Context): ThunkFunc {
		const handlers = ComponentActor.signalHandlers[signal.scope]
		const handler = handlers && handlers[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	receiveAction(action: ComponentAction, state: RuntimeState): RuntimeState {
		const reducers = ComponentActor.actionReducers[action.scope]
		const reducer = reducers && reducers[action.name] // should be alled name or type
		if (reducer && action.view && state.view) {
			state.view[action.view].components = Object.assign(
				{},
				state.view[action.view].components,
				{
					[action.target]: reducer(action, this.source, state),
				}
			)
		}
		return state
	}

	// Serializes this wire into a redux state
	toState(): PlainComponentState {
		return { ...this.source }
	}

	getId(): string {
		return ""
	}

	isValid(): boolean {
		return this.valid
	}

	static registerActionReducer(
		scope: string,
		actionGroup: ActionGroup
	): void {
		if (this.actionReducers[scope]) return
		this.actionReducers[scope] = actionGroup
	}

	static registerSignalsHandler(
		scope: string,
		signalsHandler: SignalsHandler
	): void {
		if (this.signalHandlers[scope]) return
		this.signalHandlers[scope] = signalsHandler
	}
}

export {
	ComponentActor,
	PlainComponentState,
	PlainComponentStateMap,
	INTERNAL_SCOPE,
}
