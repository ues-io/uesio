import { Context, ContextFrame } from "../context/context"
import { SignalDefinition, SignalDescriptor } from "../definition/signal"
import { appDispatch } from "../store/store"
import componentSignal from "../bands/component/signals"

import collectionSignals from "../bands/collection/signals"
import botSignals from "../bands/bot/signals"
import routeSignals from "../bands/route/signals"
import userSignals from "../bands/user/signals"
import wireSignals from "../bands/wire/signals"
import panelSignals from "../bands/panel/signals"
import notificationSignals from "../bands/notification/signals"
import { additionalContext } from "../component/component"
import debounce from "lodash/debounce"
import { getErrorString } from "../utilexports"
const registry: Record<string, SignalDescriptor> = {
	...collectionSignals,
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
		// Some signal handlers don't handle errors, so we catch them here
		try {
			context = await run(signal, context)
		} catch (error) {
			context = context.addFrame({ errors: [getErrorString(error)] })
		}

		// Any errors in this frame are the result of the signal run above, nothing else
		const currentErrors = context.getCurrentErrors() || []

		if (currentErrors.length) {
			const signals = [
				...(signal?.onerror?.signals || []),
				...(signal.onerror?.notify === false
					? []
					: currentErrors.map((text) => ({
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
