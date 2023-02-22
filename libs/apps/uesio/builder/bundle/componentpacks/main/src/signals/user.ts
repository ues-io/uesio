import { SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const USER_BAND = "user"

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${USER_BAND}/SIGNUP`]: {
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
		label: "SignUp Confirmation",
		description: "SignUp Confirmation",
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
		label: "Logout",
		description: "Logout",
		properties: () => [],
	},
	[`${USER_BAND}/CHECK_AVAILABILITY`]: {
		label: "Check availability",
		description: "Check username availability",
		properties: () => [],
	},
	[`${USER_BAND}/FORGOT_PASSWORD`]: {
		label: "Forgot Password",
		description: "Forgot Password",
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
	[`${USER_BAND}/FORGOT_PASSWORD_CONFIRM`]: {
		label: "Forgot Password Confirmation",
		description: "Forgot Password Confirmation",
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
	[`${USER_BAND}/CREATE_LOGIN`]: {
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
