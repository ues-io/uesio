import { Context, injectDynamicContext, newContext } from "../context/context"
import { SignalDefinition, SignalDescriptor } from "../definition/signal"
import { getComponentSignalDefinition } from "../bands/component/signals"

import aiSignals from "../bands/ai/signals"
import collectionSignals from "../bands/collection/signals"
import botSignals from "../bands/bot/signals"
import routeSignals from "../bands/route/signals"
import userSignals from "../bands/user/signals"
import wireSignals from "../bands/wire/signals"
import panelSignals from "../bands/panel/signals"
import toolsSignals from "../bands/tools/signals"
import notificationSignals from "../bands/notification/signals"
import contextSignals from "../context/signals"
import debounce from "lodash/debounce"
import { getErrorString } from "../utilexports"

const registry: Record<string, SignalDescriptor> = {
	...aiSignals,
	...collectionSignals,
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
	...panelSignals,
	...toolsSignals,
	...notificationSignals,
	...contextSignals,
}

const run = (signal: SignalDefinition, context: Context) => {
	const descriptor = registry[signal.signal] || getComponentSignalDefinition()
	return descriptor.dispatcher(
		signal,
		injectDynamicContext(context, signal?.["uesio.context"])
	)
}

// TODO: write tests
const runMany = async (signals: SignalDefinition[], context: Context) => {
	// If we have a custom slot context, don't run signals
	const slotWrapper = context.getCustomSlot()
	if (slotWrapper) return context
	for (const signal of signals) {
		// Some signal handlers don't handle errors, so we catch them here
		try {
			context = await run(signal, context)
		} catch (error) {
			context = context.addErrorFrame([getErrorString(error)])
			console.error(error)
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
			await runMany(signals, newContext())
			if (!signal.onerror?.continue) break
		}
	}

	return context
}

const runManyThrottled = debounce(runMany, 250)

export { run, runMany, runManyThrottled, registry }
