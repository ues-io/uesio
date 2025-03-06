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
import { getRouteUrl } from "../bands/route/operations"
import { MouseEvent } from "react"
import { getRouteAssignmentUrl } from "./routeapi"

const getNavigateLink = (
  signals: SignalDefinition[] | undefined,
  context: Context,
) => {
  if (!signals || signals.length !== 1) return undefined
  const signal = signals[0] as
    | PathNavigateSignal
    | AssignmentNavigateSignal
    | RedirectSignal

  if (signal.preventLinkTag) return undefined

  if (signal.signal === "route/NAVIGATE") {
    if (!signal.path) return undefined
    return getRouteUrl(context, signal.namespace, signal.path)
  }

  if (signal.signal === "route/NAVIGATE_TO_ASSIGNMENT") {
    return getRouteAssignmentUrl(
      context,
      signal.collection,
      signal.viewtype,
      signal.recordid !== undefined ? { recordid: signal.recordid } : undefined,
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
  setPendingState?: (isPending: boolean) => void,
) => {
  const link = getNavigateLink(signals, context)
  if (!signals) return [undefined, undefined] as const
  return [
    link,
    async (e: MouseEvent) => {
      // Allow the default behavior if the meta key is active
      const isMeta = e.getModifierState("Meta")
      if (isMeta) return
      e.preventDefault()
      // Stopping propagation here to prevent actions higher in the
      // hierarchy from firing. For example a default row action
      // for a table row.
      e.stopPropagation()
      setPendingState?.(true)
      await runMany(signals, context)
      setPendingState?.(false)
    },
  ] as const
}

// Returns a handler function for running a list of signals
const getHandler = (
  signals: SignalDefinition[] | undefined,
  context: Context,
) => {
  if (!signals) return undefined
  return () => runMany(signals, context)
}

const useRegisterHotKey = (
  keycode: string | undefined,
  signals: SignalDefinition[] | undefined,
  context: Context,
) =>
  useHotKeyCallback(
    keycode,
    (event) => {
      event.preventDefault()
      getHandler(signals, context)?.()
    },
    signals && signals.length > 0,
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
