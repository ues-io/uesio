import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import {
	AssignmentNavigateRequest,
	PathNavigateRequest,
} from "../../platform/platform"
import { getCurrentState } from "../../store/store"
import { navigate, navigateToAssignment, redirect } from "./operations"

// The key for the entire band
const ROUTE_BAND = "route"

interface RedirectSignal extends SignalDefinition {
	path: string
	newtab?: boolean
}

type PathNavigateSignal = SignalDefinition & PathNavigateRequest

type AssignmentNavigateSignal = SignalDefinition & AssignmentNavigateRequest

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${ROUTE_BAND}/REDIRECT`]: {
		dispatcher: (signal: RedirectSignal, context: Context) =>
			redirect(
				context,
				context.mergeString(signal.path),
				context.mergeBoolean(signal.newtab, false)
			),
	},
	[`${ROUTE_BAND}/RELOAD`]: {
		dispatcher: (signal: SignalDefinition, context: Context) => {
			const routeState = getCurrentState().route
			if (!routeState) return context
			const { namespace, path } = routeState
			return navigate(context, {
				namespace,
				path,
			})
		},
	},
	[`${ROUTE_BAND}/NAVIGATE`]: {
		dispatcher: (signal: PathNavigateSignal, context: Context) =>
			navigate(context, context.mergeMap(signal)),
	},
	[`${ROUTE_BAND}/NAVIGATE_TO_ASSIGNMENT`]: {
		dispatcher: (signal: AssignmentNavigateSignal, context: Context) =>
			navigateToAssignment(context, context.mergeMap(signal)),
	},
}

export type { PathNavigateSignal }

export default signals
