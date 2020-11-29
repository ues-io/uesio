import {
	Dispatcher,
	useComponentState,
	DispatchReturn,
	ThunkFunc,
} from "../store/store"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { ACTOR, StoreAction, ActionGroup } from "../store/actions/actions"
import {
	ComponentActor,
	PlainComponentState,
	INTERNAL_SCOPE,
} from "../componentactor/componentactor"
import { SET_DEFAULT_STATE } from "../componentactor/componentactions"
import { useEffect } from "react"
import { getBand } from "../actor/band"
import RuntimeState from "../store/types/runtimestate"
import { COMPONENT_BAND } from "../componentactor/componentband"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
import { registry as botRegistry } from "../bands/bot/signals"
import { registry as userRegistry } from "../bands/user/signals"
import { registry as routeRegistry } from "../bands/route/signals"
import { BotSignal } from "../bands/bot/types"

const signalRegistry = {
	bot: botRegistry,
	user: userRegistry,
	route: routeRegistry,
}

type RegisteredSignal = BotSignal

const validateSignalBand = (
	signal: SignalDefinition
): signal is RegisteredSignal => {
	return signal.band in signalRegistry
}

function getSignalHandler(
	signal: SignalDefinition,
	context: Context
): ThunkFunc {
	return (
		dispatch: Dispatcher<StoreAction>,
		getState: () => RuntimeState
	): DispatchReturn => {
		// New method of calling signals (ducks with signal registries)
		if (validateSignalBand(signal)) {
			const registry = signalRegistry[signal.band]
			if (registry.validateSignal(signal)) {
				const handler = registry.handlers[signal.signal]
				return dispatch(handler.dispatcher(signal, context))
			}
		}

		// Old method of calling signals (Actor and Band classes)
		// TODO: remove this completely
		const band = getBand(signal.band)
		const target = signal.target
			? band.getActor(
					getState(),
					signal.target,
					context.getView()?.getId()
			  )
			: band
		return dispatch(target.receiveSignal(signal, context))
	}
}

class SignalAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>

	// Returns a handler function for running a list of signals
	getHandler(signals: SignalDefinition[]) {
		return async (): DispatchReturn => {
			let context = this.uesio.getProps().context
			for (const signal of signals) {
				// Keep adding to context as each signal is run
				context = await this.run(signal, context)
			}
			return context
		}
	}

	static run(
		signal: SignalDefinition,
		context: Context,
		dispatcher: Dispatcher<StoreAction>
	): DispatchReturn {
		return dispatcher(getSignalHandler(signal, context))
	}

	run(signal: SignalDefinition, context: Context): DispatchReturn {
		return this.dispatcher(getSignalHandler(signal, context))
	}

	useSignals(
		componentId: string,
		signalsHandler: SignalsHandler,
		actionGroup: ActionGroup,
		initialState: PlainComponentState
	): ComponentActor {
		const view = this.uesio.getView()
		const componentData = useComponentState(componentId, view?.getId())
		useEffect(() => {
			const componentType = this.uesio.getComponentType()
			if (!componentType) {
				return
			}
			ComponentActor.registerActionReducer(componentType, actionGroup)
			ComponentActor.registerSignalsHandler(componentType, signalsHandler)
		}, [])

		useEffect(() => {
			if (!componentData && view) {
				this.dispatcher({
					type: ACTOR,
					target: componentId,
					name: SET_DEFAULT_STATE,
					band: COMPONENT_BAND,
					scope: INTERNAL_SCOPE,
					data: {
						defaultState: initialState,
					},
					view: view.getId(),
				})
			}
		})

		return new ComponentActor(componentData)
	}
}

export { SignalAPI }
