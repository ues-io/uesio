import {
	ComponentSignal,
	ComponentSignalDescriptor,
	SignalDefinition,
	SignalDescriptor,
} from "../definition/signal"
import { Context } from "../context/context"
import { run, runMany, registry } from "../signals/signals"
import { useHotKeyCallback } from "./hotkeys"

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
	getSignal,
	getSignals,
	getHandler,
	useRegisterHotKey,
	runMany,
	run,
	ComponentSignal,
	ComponentSignalDescriptor,
}
