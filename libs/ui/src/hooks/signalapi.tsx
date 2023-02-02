import { SignalDefinition } from "../definition/signal"
import { Context } from "../context/context"
import { run, runMany } from "../signals/signals"
import { useHotKeyCallback } from "./hotkeys"
import { DependencyList, useEffect } from "react"

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

const useSubscribe = (
	signal: string,
	callback: () => void,
	deps: DependencyList
) => {
	useEffect(() => {
		document.addEventListener(signal, callback)
		return () => {
			document.removeEventListener(signal, callback)
		}
	}, deps)
}

export { getHandler, useRegisterHotKey, runMany, run, useSubscribe }
