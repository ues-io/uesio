import {
	ComponentSignalDescriptor,
	SignalDefinition,
	SignalDescriptor,
} from "../definition/signal"
import { getComponentSignalDefinition } from "../bands/component/signals"
import { Context } from "../context/context"
import { run, runMany, registry } from "../signals/signals"
import { useHotKeyCallback } from "./hotkeys"
import {
	AssignmentNavigateSignal,
	PathNavigateSignal,
	RedirectSignal,
} from "../bands/route/signals"
import { getRouteUrlPrefix } from "../bands/route/operations"
import { MouseEvent, useEffect, useRef } from "react"

const urlJoin = (...args: string[]) => args.join("/").replace(/[/]+/g, "/")

const getNavigateLink = (
	signals: SignalDefinition[] | undefined,
	context: Context
) => {
	if (!signals || signals.length !== 1) return undefined
	const signal = signals[0] as
		| PathNavigateSignal
		| AssignmentNavigateSignal
		| RedirectSignal

	if (signal.signal === "route/NAVIGATE") {
		if (!signal.path) return undefined
		const prefix = getRouteUrlPrefix(context, signal.namespace)
		return urlJoin(prefix, context.mergeString(signal.path))
	}

	if (signal.signal === "route/NAVIGATE_TO_ASSIGNMENT") {
		const prefix = getRouteUrlPrefix(context, undefined)
		const assignment = context.getRouteAssignment(
			`${signal.collection}_${signal.viewtype || "list"}`
		)
		if (!assignment) return undefined

		return urlJoin(
			prefix,
			context
				.addRecordDataFrame({
					recordid: context.mergeString(signal.recordid),
				})
				.mergeString(assignment.path.replace(/{/g, "${"))
		)
	}

	if (signal.signal === "route/REDIRECT") {
		if (!signal.path) return undefined
		return context.mergeString(signal.path)
	}

	return undefined
}

const useLinkHandler = (
	signals: SignalDefinition[] | undefined,
	context: Context,
	setPendingState?: (isPending: boolean) => void
) => {
	const isMounted = useRef<boolean>(true)
	useEffect(
		() => () => {
			isMounted.current = false
		},
		[]
	)

	const link = getNavigateLink(signals, context)
	if (!signals) return [undefined, undefined] as const
	return [
		link,
		async (e: MouseEvent) => {
			// Allow the default behavior if the meta key is active
			const isMeta = e.getModifierState("Meta")
			if (isMeta) return
			e.preventDefault()
			setPendingState?.(true)
			await runMany(signals, context)
			isMounted.current && setPendingState?.(false)
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
