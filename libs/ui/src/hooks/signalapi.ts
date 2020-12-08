import { Dispatcher, ThunkFunc } from "../store/store"
import { SignalDefinition } from "../definition/signal"
import { StoreAction } from "../store/actions/actions"
import { getBand } from "../actor/band"
import RuntimeState from "../store/types/runtimestate"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
import { SignalDescriptor } from "../definition/signal"

import botSignals from "../bands/bot/signals"
import routeSignals from "../bands/route/signals"
import userSignals from "../bands/user/signals"
import wireSignals from "../bands/wire/signals"
import { AnyAction } from "@reduxjs/toolkit"
import { getSignal } from "../component/registry"
import { parseKey } from "../component/path"
import { selectState } from "../bands/component/selectors"
import { PlainComponentState } from "../bands/component/types"

type SignalRegistry = {
	[key: string]: SignalDescriptor
}

const registry: SignalRegistry = {}

const register = (descriptors: SignalRegistry) => {
	for (const key in descriptors) {
		registry[key] = descriptors[key]
	}
}

register(botSignals)
register(routeSignals)
register(userSignals)
register(wireSignals)

function getSignalHandler(
	signal: SignalDefinition,
	context: Context
): ThunkFunc {
	// New method of calling signals
	const target = signal.target
	const descriptor = registry[signal.signal]
	if (descriptor) {
		return descriptor.dispatcher(signal, context)
	}

	// Find component signals
	const [band, scope, type] = signal.signal.split("/")

	if (band === "component" && scope && type && target) {
		const [namespace, name] = parseKey(scope)
		const handler = getSignal(namespace, name, type)
		const viewId = context.getViewId()
		return (
			dispatch: Dispatcher<AnyAction>,
			getState: () => RuntimeState
		) =>
			handler.dispatcher(signal, context)(
				(state: PlainComponentState) => {
					dispatch({
						type: "component/set",
						payload: {
							id: target,
							componentType: scope,
							view: viewId,
							state,
						},
					})
				},
				() => selectState(getState(), scope, target, viewId)
			)
	}

	return (
		dispatch: Dispatcher<StoreAction>,
		getState: () => RuntimeState
	) => {
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
	dispatcher: Dispatcher<AnyAction>

	// Returns a handler function for running a list of signals
	getHandler = (signals: SignalDefinition[]) => async () => {
		let context = this.uesio.getProps().context
		for (const signal of signals) {
			// Keep adding to context as each signal is run
			context = await this.run(signal, context)
		}
		return context
	}

	// Runs a signal that has been registered in the signal registry
	static run = (
		signal: SignalDefinition,
		context: Context,
		dispatcher: Dispatcher<AnyAction>
	) => dispatcher(getSignalHandler(signal, context))

	run = (signal: SignalDefinition, context: Context) =>
		SignalAPI.run(signal, context, this.dispatcher)
}

export { SignalAPI, SignalRegistry }
