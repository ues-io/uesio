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
interface ForgotPasswordSignal extends SignalDefinition {
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
		label: "Signup",
		description: "Signup",
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
	[`${USER_BAND}/SIGNUP_CONFIRM`]: {
		dispatcher: (signal: ForgotPasswordSignal, context: Context) =>
			operations.signUpConfirm(
				context,
				signal.authSource,
				signal.payload
			),
		label: "SignUp Confirmation",
		description: "SignUp Confirmation",
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
	[`${USER_BAND}/LOGIN`]: {
		dispatcher: (signal: LoginSignal, context: Context) =>
			operations.login(context, signal.authSource, signal.payload),
		label: "Login",
		description: "Login",
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
		description: "Logout",
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
		label: "Check availability",
		description: "Check username availability",
		properties: () => [],
	},
	[`${USER_BAND}/FORGOT_PASSWORD`]: {
		dispatcher: (signal: ForgotPasswordSignal, context: Context) =>
			operations.forgotPassword(
				context,
				signal.authSource,
				signal.payload
			),
		label: "Forgot Password",
		description: "Forgot Password",
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
	[`${USER_BAND}/FORGOT_PASSWORD_CONFIRM`]: {
		dispatcher: (signal: ForgotPasswordSignal, context: Context) =>
			operations.forgotPasswordConfirm(
				context,
				signal.authSource,
				signal.payload
			),
		label: "Forgot Password Confirmation",
		description: "Forgot Password Confirmation",
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
	[`${USER_BAND}/CREATE_LOGIN`]: {
		dispatcher: (signal: CreateLoginSignal, context: Context) =>
			operations.createLogin(
				context,
				signal.signupMethod,
				signal.payload
			),
		label: "Create Login",
		description: "Create a new login for a signup method",
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
}
export default signals
