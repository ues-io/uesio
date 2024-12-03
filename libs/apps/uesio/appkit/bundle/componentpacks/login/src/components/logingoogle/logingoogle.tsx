import { definition, api, signal } from "@uesio/ui"
import LoginGoogleUtility from "../../utilities/logingoogle/logingoogle"

type ButtonDefinition = {
	onLoginSignals?: signal.SignalDefinition[]
	text?: string
	minWidth?: number
	oneTap?: boolean
	useFedCM?: boolean
}

type GoogleLoginResponse = {
	credential: string
	client_id: string
}

const validSignals = ["user/LOGIN", "user/CREATE_LOGIN", "user/SIGNUP"]

const LoginGoogle: definition.UC<ButtonDefinition> = ({
	context,
	definition,
}) => {
	const {
		onLoginSignals,
		minWidth = 240,
		text,
		oneTap,
		useFedCM,
	} = definition
	const handler = (loginresponse: GoogleLoginResponse) => {
		let loginSignals: signal.SignalDefinition[]
		if (!onLoginSignals || !onLoginSignals.length) {
			loginSignals = [
				{
					signal: "user/LOGIN",
					authSource: "uesio/core.google",
					payload: {},
				},
			]
		} else {
			loginSignals = structuredClone(onLoginSignals)
		}

		const primarySignal = loginSignals[0]
		const isValidSignal = validSignals.includes(primarySignal.signal)

		if (!isValidSignal) {
			throw new Error("Invalid signal for google login")
		}

		const payload = primarySignal.payload as Record<string, string>

		if (!payload) {
			throw new Error(
				"Invalid signal for google login: payload must be provided"
			)
		}

		if (!primarySignal.onerror) {
			primarySignal.onerror = {
				signals: [{ signal: "notification/ADD_ERRORS" }],
			}
		}

		// Add creds to login signal
		payload.credential = loginresponse.credential
		payload.client_id = loginresponse.client_id

		if (primarySignal.signal !== "")
			api.signal.runMany(loginSignals, context)
	}
	return (
		<LoginGoogleUtility
			context={context}
			onLogin={handler}
			minWidth={minWidth}
			text={text}
			oneTap={oneTap}
			useFedCM={useFedCM}
		/>
	)
}

export default LoginGoogle
