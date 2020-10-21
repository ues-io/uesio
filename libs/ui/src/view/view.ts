import Actor from "../actor/actor"
import RuntimeState from "../store/types/runtimestate"
import { ActorAction, ActionGroup } from "../store/actions/actions"
import { ThunkFunc } from "../store/store"
import { ViewDefBand } from "../viewdef/viewdefband"
import { ViewDef } from "../viewdef/viewdef"
import { PlainWireMap } from "../wire/wire"
import { PlainComponentStateMap } from "../componentactor/componentactor"
import {
	SET_LOADED,
	SET_PARAMS,
	SetParamsAction,
	SetLoadedAction,
} from "./viewactions"
import { SignalDefinition } from "../definition/signal"

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
			return Actor.assignState("view", state, {
				[target]: actionHandler(action, state.view?.[target], state),
			})
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
		return ViewDefBand.makeId(this.getNamespace(), this.getName())
	}

	getViewDef(state: RuntimeState): ViewDef {
		return ViewDefBand.getActor(state, this.getViewDefId())
	}
}

export { View, PlainView, PlainViewMap, ViewParams }
