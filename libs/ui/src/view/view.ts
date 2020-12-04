import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import { ActorAction, ActionGroup } from "../store/actions/actions"
import { ThunkFunc } from "../store/store"
import { PlainWireMap } from "../wire/wire"
import { PlainComponentStateMap } from "../componentactor/componentactor"
import {
	SET_LOADED,
	SET_PARAMS,
	SetParamsAction,
	SetLoadedAction,
} from "./viewactions"
import { SignalDefinition } from "../definition/signal"
import { PlainViewDef } from "../bands/viewdef/types"

type ErrorState = {
	type: string
	message: string
}

type ErrorMap = {
	[key: string]: ErrorState
}

type ViewParams = {
	[key: string]: string
}

type PlainView = {
	name: string
	namespace: string
	path: string
	params: ViewParams
	errors?: ErrorMap
	loaded: boolean
	wires: PlainWireMap
	components: PlainComponentStateMap
}

type PlainViewMap = {
	[key: string]: PlainView
}

class View extends Actor {
	static actionGroup: ActionGroup = {
		[SET_PARAMS]: (
			action: SetParamsAction,
			state: PlainView
		): PlainView => {
			return {
				...state,
				...(action?.data?.params ? { params: action.data.params } : {}),
				loaded: false,
			}
		},
		[SET_LOADED]: (
			action: SetLoadedAction,
			state: PlainView
		): PlainView => {
			return {
				...state,
				loaded: true,
			}
		},
	}

	constructor(source: PlainView | null) {
		super()
		this.valid = !!source
		this.source = source || ({} as PlainView)
	}

	source: PlainView
	valid: boolean

	receiveAction(action: ActorAction, state: RuntimeState): RuntimeState {
		const actionHandler = View.actionGroup[action.name]
		const target = this.getId()
		if (actionHandler) {
			return {
				...state,
				view: {
					...state.view,
					[target]: actionHandler(
						action,
						state.view?.[target],
						state
					) as PlainView,
				},
			}
		}
		return state
	}

	receiveSignal(signal: SignalDefinition): ThunkFunc {
		throw new Error("No Handler found for signal: " + signal.signal)
	}

	// Serializes this wire into a redux state
	toState(): PlainView {
		return {
			name: "",
			namespace: "",
			path: "",
			params: {},
			loaded: false,
			wires: {},
			components: {},
		}
	}

	getId(): string {
		return `${this.source.namespace}.${this.source.name}(${this.source.path})`
	}

	getName(): string {
		return this.source.name
	}

	getNamespace(): string {
		return this.source.namespace
	}

	getParams(): ViewParams {
		return this.source.params
	}

	getParam(param: string): string | null {
		return this.source.params?.[param] || null
	}

	getViewDefId(): string {
		return `${this.getNamespace()}.${this.getName()}`
	}

	getViewDef(state: RuntimeState): PlainViewDef | undefined {
		return state.viewdef?.entities[this.getViewDefId()]
	}
}

export { View, PlainView, PlainViewMap, ViewParams }
