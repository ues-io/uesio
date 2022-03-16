import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import operations from "./operations"
import { SignupSignal } from "../../auth/auth"

// The key for the entire band
const USER_BAND = "user"

interface LoginSignal extends SignalDefinition {
	type: string
	token: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${USER_BAND}/LOGIN`]: {
		dispatcher: (signal: LoginSignal, context: Context) =>
			operations.login(context, signal.type, signal.token),
		label: "Login",
		properties: () => [
			{
				name: "type",
				label: "Type",
				type: "TEXT",
			},
			{
				name: "token",
				label: "Token",
				type: "TEXT",
			},
		],
	},
	[`${USER_BAND}/LOGOUT`]: {
		dispatcher: (signal: SignalDefinition, context: Context) =>
			operations.logout(context),
		label: "Logout",
		properties: () => [],
	},
	[`${USER_BAND}/SIGNUP`]: {
		dispatcher: (signal: SignupSignal, context: Context) =>
			operations.signUp(context),
		label: "Signup",
		properties: () => [],
	},
}
export default signals
