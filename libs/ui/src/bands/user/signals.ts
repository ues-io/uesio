import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import operations from "./operations"

// The key for the entire band
const USER_BAND = "user"

interface LoginSignal extends SignalDefinition {
	type: string
	token: string
}

// "Signal Handlers" for all of the signals in the band
const signals: { [key: string]: SignalDescriptor } = {
	[`${USER_BAND}/LOGIN`]: {
		dispatcher: (signal: LoginSignal, context: Context) =>
			operations.login(context, signal.type, signal.token),
		label: "TODO: Login",
		properties: () => [],
	},
	[`${USER_BAND}/LOGOUT`]: {
		dispatcher: (signal: SignalDefinition, context: Context) =>
			operations.logout(context),
		label: "Logout",
		properties: () => [],
	},
}
export default signals
