import { SignalDefinition } from "../definition/signal"
import { Context } from "../context/context"
import { run, runMany } from "../signals/signals"
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

export { getHandler, useRegisterHotKey, runMany, run }
