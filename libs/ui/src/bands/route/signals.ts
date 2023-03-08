import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import {
	CollectionNavigateRequest,
	PathNavigateRequest,
} from "../../platform/platform"
import { getCurrentState } from "../../store/store"
import { navigate, redirect } from "./operations"

// The key for the entire band
const ROUTE_BAND = "route"

interface RedirectSignal extends SignalDefinition {
	path: string
	newtab?: boolean
}

type PathNavigateSignal = SignalDefinition & PathNavigateRequest

type CollectionNavigateSignal = SignalDefinition & CollectionNavigateRequest

type NavigateSignal = PathNavigateSignal | CollectionNavigateSignal

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${ROUTE_BAND}/REDIRECT`]: {
		dispatcher: (signal: RedirectSignal, context: Context) =>
			redirect(context, signal.path, signal.newtab),
	},
	[`${ROUTE_BAND}/REDIRECT_TO_VIEW_CONFIG`]: {
		dispatcher: (signal: RedirectSignal, context: Context) => {
			const workspace = context.getWorkspace()
			const route = context.getRoute()
			if (!workspace || !route) {
				throw new Error("Not in a Workspace Context")
			}
			const [, viewName] = parseKey(route.view)
			return redirect(
				context,
				`/app/${workspace.app}/workspace/${workspace.name}/views/${viewName}`
			)
		},
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
		dispatcher: (signal: NavigateSignal, context: Context) =>
			navigate(context, signal),
	},
}

export { PathNavigateSignal }

export default signals
