import { Context, ContextFrame } from "../context/context"
import { SignalDefinition, SignalDescriptor } from "../definition/signal"
import { Dispatcher } from "../store/store"
import componentSignal from "../bands/component/signals"

import botSignals from "../bands/bot/signals"
import routeSignals from "../bands/route/signals"
import userSignals from "../bands/user/signals"
import wireSignals from "../bands/wire/signals"
import panelSignals from "../bands/panel/signals"
import notificationSignals from "../bands/notification/signals"
import { additionalContext } from "../component/component"
import debounce from "lodash/debounce"

const registry: Record<string, SignalDescriptor> = {
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
	...panelSignals,
	...notificationSignals,
}

const run = (
	dispatcher: Dispatcher,
	path: string,
	signal: SignalDefinition,
	context: Context
) => {
	const descriptor = registry[signal.signal] || componentSignal
	return dispatcher(
		descriptor.dispatcher(
			signal,
			additionalContext(
				context,
				signal?.["uesio.context"] as ContextFrame
			),
			path
		)
	)
}

const runMany = async (
	dispatcher: Dispatcher,
	path: string,
	signals: SignalDefinition[],
	context: Context
) => {
	for (const signal of signals) {
		try {
			// Keep adding to context as each signal is run
			context = await run(dispatcher, path, signal, context)
		} catch (error) {
			if (signal.onerror?.signals) {
				runMany(
					dispatcher,
					path,
					signal.onerror.signals,
					context.addFrame({ errors: [error.message] })
				)
			}
			break
		}
	}
	return context
}

const runManyThrottled = debounce(runMany, 250)

export { run, runMany, runManyThrottled, registry }
