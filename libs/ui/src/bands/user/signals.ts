import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import operations from "./operations"

// The key for the entire band
const USER_BAND = "user"

interface LoginSignal extends SignalDefinition {
	authSource: string
	payload: Record<string, string>
}
interface SignupSignal extends SignalDefinition {
	signupMethod: string
	payload: Record<string, string>
}
interface UsernameTestSignal extends SignalDefinition {
	username: string
	signupMethod: string
	fieldId: string
}
interface ResetPasswordSignal extends SignalDefinition {
	authSource: string
	payload: Record<string, string>
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${USER_BAND}/SIGNUP`]: {
		dispatcher: (signal: SignupSignal, context: Context) =>
			operations.signup(context, signal.signupMethod, signal.payload),
		label: "Signup",
		properties: () => [
			{
				name: "signupMethod",
				label: "Signup Method",
				type: "TEXT",
			},
			{
				name: "payload",
				label: "Payload",
				type: "TEXT", // TODO: Fix this
			},
		],
	},
	[`${USER_BAND}/LOGIN`]: {
		dispatcher: (signal: LoginSignal, context: Context) =>
			operations.login(context, signal.authSource, signal.payload),
		label: "Login",
		properties: () => [
			{
				name: "authSource",
				label: "Auth Source",
				type: "TEXT",
			},
			{
				name: "payload",
				label: "Payload",
				type: "TEXT", // TODO: Fix this
			},
		],
	},
	[`${USER_BAND}/LOGOUT`]: {
		dispatcher: (signal: SignalDefinition, context: Context) =>
			operations.logout(context),
		label: "Logout",
		properties: () => [],
	},
	[`${USER_BAND}/CHECK_AVAILABILITY`]: {
		dispatcher: (signal: UsernameTestSignal, context: Context) =>
			operations.checkAvailability(
				context,
				signal.username,
				signal.signupMethod,
				signal.fieldId
			),
		label: "Test Username",
		properties: () => [],
	},
	[`${USER_BAND}/RESET_PASSWORD`]: {
		dispatcher: (signal: ResetPasswordSignal, context: Context) =>
			operations.resetPassword(
				context,
				signal.authSource,
				signal.payload
			),
		label: "Reset Password",
		properties: () => [
			{
				name: "authSource",
				label: "Auth Source",
				type: "TEXT",
			},
			{
				name: "payload",
				label: "Payload",
				type: "TEXT", // TODO: Fix this
			},
		],
	},
}
export default signals
