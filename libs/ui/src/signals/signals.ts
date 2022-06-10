import { Context, ContextFrame } from "../context/context"
import { SignalDefinition, SignalDescriptor } from "../definition/signal"
import { appDispatch } from "../store/store"
import componentSignal from "../bands/component/signals"

import botSignals from "../bands/bot/signals"
import routeSignals from "../bands/route/signals"
import userSignals from "../bands/user/signals"
import wireSignals from "../bands/wire/signals"
import panelSignals from "../bands/panel/signals"
import notificationSignals from "../bands/notification/signals"
import { additionalContext } from "../component/component"
import debounce from "lodash/debounce"
import { getErrorString } from "../bands/utils"

const registry: Record<string, SignalDescriptor> = {
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
	...panelSignals,
	...notificationSignals,
}

const run = (signal: SignalDefinition, context: Context) => {
	const descriptor = registry[signal.signal] || componentSignal
	return appDispatch()(
		descriptor.dispatcher(
			signal,
			additionalContext(
				context,
				signal?.["uesio.context"] as ContextFrame
			)
		)
	)
}

const runMany = async (signals: SignalDefinition[], context: Context) => {
	for (const signal of signals) {
		try {
			// Keep adding to context as each signal is run
			context = await run(signal, context)
		} catch (error) {
			const message = getErrorString(error)
			if (signal.onerror?.signals) {
				runMany(
					signal.onerror.signals,
					context.addFrame({ errors: [message] })
				)
			}
			break
		}
	}
	return context
}

const runManyThrottled = debounce(runMany, 250)

export { run, runMany, runManyThrottled, registry }
