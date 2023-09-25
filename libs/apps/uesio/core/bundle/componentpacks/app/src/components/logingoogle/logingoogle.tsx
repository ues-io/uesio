import { definition, api, signal } from "@uesio/ui"
import LoginGoogleUtility from "../../utilities/logingoogle/logingoogle"

type ButtonDefinition = {
	onLoginSignals?: signal.SignalDefinition[]
	minWidth?: number
}

type GoogleLoginResponse = {
	credential: string
	client_id: string
}

const LoginGoogle: definition.UC<ButtonDefinition> = ({
	context,
	definition,
}) => {
	const { onLoginSignals, minWidth } = definition
	const handler = (loginresponse: GoogleLoginResponse) => {
		if (!onLoginSignals) return
		api.signal.runMany(
			onLoginSignals,
			context.addComponentFrame("uesio/core.logingoogle", {
				credential: loginresponse.credential,
				client_id: loginresponse.client_id,
			})
		)
	}
	return (
		<LoginGoogleUtility
			context={context}
			onLogin={handler}
			minWidth={minWidth}
		/>
	)
}

export default LoginGoogle
