import { Dispatcher } from "../store/store"
import { SignalDefinition, SignalDescriptor } from "../definition/signal"
import { Uesio } from "./hooks"
import { Context } from "../context/context"

import botSignals from "../bands/bot/signals"
import routeSignals from "../bands/route/signals"
import userSignals from "../bands/user/signals"
import wireSignals from "../bands/wire/signals"
import componentSignal from "../bands/component/signals"
import { AnyAction } from "@reduxjs/toolkit"

const registry: Record<string, SignalDescriptor> = {
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
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
		// More confusing alternative using reduce
		return signals.reduce<Promise<Context>>(
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
		const descriptor = registry[signal.signal] || componentSignal
		return this.dispatcher(descriptor.dispatcher(signal, context))
	}
}

export { SignalAPI }
