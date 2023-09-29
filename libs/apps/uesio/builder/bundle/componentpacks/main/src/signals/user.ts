import { SignalBandDefinition, SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const BAND = "user"

// Metadata for all signals in the band
const signals: SignalBandDefinition = {
	band: BAND,
	label: "User",
	signals: {
		[`${BAND}/SIGNUP`]: {
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
		[`${BAND}/LOGIN`]: {
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
		[`${BAND}/LOGOUT`]: {
			label: "Logout",
			description: "Logout",
			properties: () => [],
		},
		[`${BAND}/FORGOT_PASSWORD`]: {
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
		[`${BAND}/FORGOT_PASSWORD_CONFIRM`]: {
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
		[`${BAND}/CREATE_LOGIN`]: {
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
	} as Record<string, SignalDescriptor>,
}
export default signals
