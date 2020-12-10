import { Dispatcher } from "../store/store"
import { SignalDefinition } from "../definition/signal"
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

const runComponentSignal = (
	signal: SignalDefinition,
	context: Context
) => async (dispatch: Dispatcher<AnyAction>, getState: () => RuntimeState) => {
	// Call Component Signal
	const [band, scope, type] = signal.signal.split("/")
	const target = signal.target as string
	if (band === "component" && scope && type && target) {
		const [namespace, name] = parseKey(scope)
		const handler = getSignal(namespace, name, type)
		const viewId = context.getViewId()
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
	return context
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
		/*
		// More confusing alternative
		signals.reduce<Promise<Context>>(
			async (context, signal) => this.run(signal, await context),
			Promise.resolve(this.uesio.getContext())
		)
		*/

		let context = this.uesio.getContext()
		for (const signal of signals) {
			// Keep adding to context as each signal is run
			context = await this.run(signal, context)
		}
		return context
	}

	run = (signal: SignalDefinition, context: Context) => {
		// New method of calling signals
		const descriptor = registry[signal.signal]
		return this.dispatcher(
			descriptor
				? descriptor.dispatcher(signal, context)
				: runComponentSignal(signal, context)
		)
	}
}

export { SignalAPI, SignalRegistry }
