import { ActorSignal } from "../definition/signal"
import { PlainComponentState } from "./componentactor"
import { ActorAction } from "../store/actions/actions"

const SET_DEFAULT_STATE = "SET_DEFAULT_STATE"

interface ComponentSignal extends ActorSignal {
	scope: string
}

interface SetDefaultStateAction extends ActorAction {
	name: typeof SET_DEFAULT_STATE
	data: {
		defaultState: PlainComponentState
	}
}

interface ComponentAction extends ActorAction {
	scope: string
}

export {
	SET_DEFAULT_STATE,
	ComponentSignal,
	ComponentAction,
	SetDefaultStateAction,
}
