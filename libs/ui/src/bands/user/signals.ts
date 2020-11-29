import { SignalDefinition } from "../../definition/signal"
import { UserSignal } from "./types"
import operations from "./operations"

// The key for the entire band
const USER_BAND = "user"

// The keys for all signals in the band
const LOGIN = "LOGIN"
const LOGOUT = "LOGOUT"

// "Signal Creators" for all of the signals in the band
const loginSignal = (type: string, token: string) => ({
	signal: LOGIN as typeof LOGIN,
	band: USER_BAND as typeof USER_BAND,
	type,
	token,
})

const logoutSignal = () => ({
	signal: LOGOUT as typeof LOGOUT,
	band: USER_BAND as typeof USER_BAND,
})

// "Signal Handlers" for all of the signals in the band
const handlers = {
	[LOGIN]: {
		dispatcher: operations.login,
	},
	[LOGOUT]: {
		dispatcher: operations.logout,
	},
}

// A map of all of the handlers in the bot band and a function that
// can narrow the type of a signal down to a specific signal
const registry = {
	handlers,
	validateSignal: (signal: SignalDefinition): signal is UserSignal =>
		signal.signal in registry.handlers,
}

export { loginSignal, logoutSignal, registry }
