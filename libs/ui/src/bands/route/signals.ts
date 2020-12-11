import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import operations from "./operations"

// The key for the entire band
const ROUTE_BAND = "route"

interface RedirectSignal extends SignalDefinition {
	path: string
}

interface NavigateSignal extends SignalDefinition {
	path: string
	namespace: string
	noPushState?: boolean
}

// "Signal Handlers" for all of the signals in the band
export default {
	[`${ROUTE_BAND}/REDIRECT`]: {
		dispatcher: (signal: RedirectSignal, context: Context) =>
			operations.redirect(context, signal.path),
	},
	[`${ROUTE_BAND}/NAVIGATE`]: {
		dispatcher: (signal: NavigateSignal, context: Context) =>
			operations.navigate(
				context,
				signal.path,
				signal.namespace,
				signal.noPushState
			),
	},
}
