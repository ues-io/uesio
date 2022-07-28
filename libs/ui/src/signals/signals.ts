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

// TODO: write tests
const runMany = async (signals: SignalDefinition[], context: Context) => {
	for (const signal of signals) {
		context = await run(signal, context)
		// Any errors in this stack are the result of the signal run above
		const currentErrors = context.getCurrentErrors() || []

		if (currentErrors.length) {
			const signals = [
				...(signal?.onerror?.signals || []),
				// Add error notification unless it's flagged false
				...(signal.onerror?.notify === false
					? []
					: context.getCurrentErrors().map((text) => ({
							signal: "notification/ADD",
							text,
							severity: "error",
					  }))),
			]
			await runMany(signals, context.addFrame({}))

			if (!signal.onerror?.continue) break
		}
	}
	return context
}

const runManyThrottled = debounce(runMany, 250)

export { run, runMany, runManyThrottled, registry }
