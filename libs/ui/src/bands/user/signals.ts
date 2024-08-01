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
interface ResetPasswordSignal extends SignalDefinition {
	authSource: string
	payload: Record<string, string>
}
interface ResetPasswordConfirmSignal extends SignalDefinition {
	authSource: string
	payload: Record<string, string>
}
interface CreateLoginSignal extends SignalDefinition {
	signupMethod: string
	payload: Record<string, string>
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${USER_BAND}/SIGNUP`]: {
		dispatcher: (signal: SignupSignal, context: Context) =>
			operations.signup(context, signal.signupMethod, signal.payload),
	},
	[`${USER_BAND}/LOGIN`]: {
		dispatcher: (signal: LoginSignal, context: Context) =>
			operations.login(context, signal.authSource, signal.payload),
	},
	[`${USER_BAND}/LOGOUT`]: {
		dispatcher: (signal: SignalDefinition, context: Context) =>
			operations.logout(context),
	},
	[`${USER_BAND}/RESET_PASSWORD`]: {
		dispatcher: (signal: ResetPasswordSignal, context: Context) =>
			operations.resetPassword(
				context,
				signal.authSource,
				signal.payload
			),
	},
	[`${USER_BAND}/RESET_PASSWORD_CONFIRM`]: {
		dispatcher: (signal: ResetPasswordConfirmSignal, context: Context) =>
			operations.resetPasswordConfirm(
				context,
				signal.authSource,
				signal.payload
			),
	},
	[`${USER_BAND}/CREATE_LOGIN`]: {
		dispatcher: (signal: CreateLoginSignal, context: Context) =>
			operations.createLogin(
				context,
				signal.signupMethod,
				signal.payload
			),
	},
}
export default signals
