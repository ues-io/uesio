import {
	ComponentSignalDescriptor,
	SignalDefinition,
	SignalDescriptor,
} from "../definition/signal"
import { getComponentSignalDefinition } from "../bands/component/signals"
import { Context } from "../context/context"
import { run, runMany, registry } from "../signals/signals"
import { useHotKeyCallback } from "./hotkeys"
import { PathNavigateSignal } from "../bands/route/signals"
import { getRouteUrlPrefix } from "../bands/route/operations"

const getNavigateLink = (
	signals: SignalDefinition[] | undefined,
	context: Context
) => {
	if (!signals || signals.length !== 1) return undefined
	const signal = signals[0] as PathNavigateSignal
	if (signal.signal !== "route/NAVIGATE" || !signal.path) return undefined
	const prefix = getRouteUrlPrefix(context, signal.namespace)
	return `${prefix}/${context.mergeString(signal.path)}`
}

// Returns a handler function for running a list of signals
const getHandler = (
	signals: SignalDefinition[] | undefined,
	context: Context
) => {
	if (!signals) return undefined
	return async () => runMany(signals, context)
}

const useRegisterHotKey = (
	keycode: string | undefined,
	signals: SignalDefinition[] | undefined,
	context: Context
) =>
	useHotKeyCallback(keycode, (event) => {
		event.preventDefault()
		getHandler(signals, context)?.()
	})

// Returns a map of all SignalDescriptors from the registry
const getSignals = (): Record<string, SignalDescriptor> => ({
	...registry,
})

// Returns the SignalDescriptor associated with the given signal name
const getSignal = (signalType: string) => registry[signalType]

export {
	getNavigateLink,
	getComponentSignalDefinition,
	getSignal,
	getSignals,
	getHandler,
	useRegisterHotKey,
	runMany,
	run,
	ComponentSignalDescriptor,
}
