import { AnyAction } from "redux"
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
import metadataSignals from "../bands/metadata/signals"
import { additionalContext } from "../component/component"
import debounce from "lodash/debounce"

const registry: Record<string, SignalDescriptor> = {
	...botSignals,
	...routeSignals,
	...userSignals,
	...wireSignals,
	...panelSignals,
	...notificationSignals,
	...metadataSignals,
}

const isPanelSignal = (signal: SignalDefinition) =>
	signal.signal.startsWith("panel/")

const getPanelKey = (path: string, context: Context) => {
	const recordContext = context.getRecordId()
	return recordContext ? `${path}:${recordContext}` : path
}

const run = (
	dispatcher: Dispatcher<AnyAction>,
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
			)
		)
	)
}

const runMany = async (
	dispatcher: Dispatcher<AnyAction>,
	path: string,
	signals: SignalDefinition[],
	context: Context
) => {
	for (const signal of signals) {
		// Special handling for panel signals
		let useSignal = signal
		if (isPanelSignal(signal)) {
			useSignal = {
				...signal,
				path: getPanelKey(path, context),
			}
		}
		// Keep adding to context as each signal is run
		context = await run(dispatcher, useSignal, context)
		// STOP running the rest of signals if there is an error
		const errors = context.getErrors()
		if (errors && errors.length) {
			break
		}
	}
	return context
}

const runManyThrottled = debounce(runMany, 250)

export { run, runMany, runManyThrottled, registry, isPanelSignal, getPanelKey }
