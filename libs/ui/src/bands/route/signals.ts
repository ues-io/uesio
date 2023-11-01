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
			redirect(context, signal.path, signal.newtab),
	},
	[`${ROUTE_BAND}/RELOAD`]: {
		dispatcher: (signal: SignalDefinition, context: Context) => {
			const routeState = getCurrentState().route
			if (!routeState) return context
			return navigate(context, {
				namespace: routeState.namespace,
				path: routeState.path,
			})
		},
	},
	[`${ROUTE_BAND}/NAVIGATE`]: {
		dispatcher: (signal: PathNavigateSignal, context: Context) =>
			navigate(context, signal),
	},
	[`${ROUTE_BAND}/NAVIGATE_TO_ASSIGNMENT`]: {
		dispatcher: (signal: AssignmentNavigateSignal, context: Context) =>
			navigateToAssignment(context, signal),
	},
}

export type { PathNavigateSignal }

export default signals
