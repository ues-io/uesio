import { SignalDefinition } from "../../definition/signal"
import { RouteSignal } from "./types"
import operations from "./operations"

// The key for the entire band
const ROUTE_BAND = "route"

// The keys for all signals in the band
const REDIRECT = "REDIRECT"
const NAVIGATE = "NAVIGATE"

// "Signal Creators" for all of the signals in the band
const redirectSignal = (path: string) => ({
	signal: REDIRECT as typeof REDIRECT,
	band: ROUTE_BAND as typeof ROUTE_BAND,
	path,
})

const navigateSignal = (
	path: string,
	namespace: string,
	noPushState?: boolean
) => ({
	signal: NAVIGATE as typeof NAVIGATE,
	band: ROUTE_BAND as typeof ROUTE_BAND,
	path,
	namespace,
	noPushState,
})

// "Signal Handlers" for all of the signals in the band
const handlers = {
	[REDIRECT]: {
		dispatcher: operations.redirect,
	},
	[NAVIGATE]: {
		dispatcher: operations.navigate,
	},
}

// A map of all of the handlers in the bot band and a function that
// can narrow the type of a signal down to a specific signal
const registry = {
	handlers,
	validateSignal: (signal: SignalDefinition): signal is RouteSignal =>
		signal.signal in registry.handlers,
}

export { redirectSignal, navigateSignal, registry }
