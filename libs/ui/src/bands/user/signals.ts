import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import operations from "./operations"

// The key for the entire band
const USER_BAND = "user"

interface LoginTokenSignal extends SignalDefinition {
	authSource: string
	token: string
}

interface LoginSignal extends SignalDefinition {
	authSource: string
	username: string
	password: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${USER_BAND}/LOGINTOKEN`]: {
		dispatcher: (signal: LoginTokenSignal, context: Context) =>
			operations.loginToken(context, signal.authSource, signal.token),
		label: "Login",
		properties: () => [
			{
				name: "authSource",
				label: "Auth Source",
				type: "TEXT",
			},
			{
				name: "token",
				label: "Token",
				type: "TEXT",
			},
		],
	},
	[`${USER_BAND}/LOGIN`]: {
		dispatcher: (signal: LoginSignal, context: Context) =>
			operations.login(
				context,
				signal.authSource,
				signal.username,
				signal.password
			),
		label: "Login",
		properties: () => [
			{
				name: "authSource",
				label: "Auth Source",
				type: "TEXT",
			},
			{
				name: "username",
				label: "Username",
				type: "TEXT",
			},
			{
				name: "password",
				label: "Password",
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
}
export default signals
