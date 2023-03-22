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
import { MouseEvent, useState } from "react"

const urlJoin = (...args: string[]) => args.join("/").replace(/[/]+/g, "/")

const getNavigateLink = (
	signals: SignalDefinition[] | undefined,
	context: Context
) => {
	if (!signals || signals.length !== 1) return undefined
	const signal = signals[0] as PathNavigateSignal
	if (!signal.path) return undefined

	if (signal.signal === "route/NAVIGATE") {
		const prefix = getRouteUrlPrefix(context, signal.namespace)
		return urlJoin(prefix, context.mergeString(signal.path))
	}

	if (signal.signal === "route/REDIRECT") {
		return context.mergeString(signal.path)
	}

	return undefined
}

const useLinkHandler = (
	signals: SignalDefinition[] | undefined,
	context: Context
) => {
	const [isRunning, setIsRunning] = useState<boolean>(false)

	const link = getNavigateLink(signals, context)
	if (!signals) return [undefined, undefined] as const
	return [
		isRunning,
		link,
		async (e: MouseEvent) => {
			// Allow the default behavior if the meta key is active
			const isMeta = e.getModifierState("Meta")
			if (isMeta) return
			e.preventDefault()
			setIsRunning(true)
			await runMany(signals, context)
			setIsRunning(false)
		},
	] as const
}

// Returns a handler function for running a list of signals
const getHandler = (
	signals: SignalDefinition[] | undefined,
	context: Context
) => {
	if (!signals) return undefined
	return () => runMany(signals, context)
}

const useRegisterHotKey = (
	keycode: string | undefined,
	signals: SignalDefinition[] | undefined,
	context: Context
) =>
	useHotKeyCallback(
		keycode,
		(event) => {
			event.preventDefault()
			getHandler(signals, context)?.()
		},
		signals && signals.length > 0
	)

// Returns a map of all SignalDescriptors from the registry
const getSignals = (): Record<string, SignalDescriptor> => ({
	...registry,
})

// Returns the SignalDescriptor associated with the given signal name
const getSignal = (signalType: string) => registry[signalType]

export {
	useLinkHandler,
	getComponentSignalDefinition,
	getSignal,
	getSignals,
	getHandler,
	useRegisterHotKey,
	runMany,
	run,
}

export type { ComponentSignalDescriptor }
