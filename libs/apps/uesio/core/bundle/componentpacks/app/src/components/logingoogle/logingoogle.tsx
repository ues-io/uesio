import { useGoogleLogin, GoogleLoginResponse } from "react-google-login"
import { FunctionComponent } from "react"
import { definition, api, component } from "@uesio/ui"
import LoginWrapper from "../../shared/loginwrapper"

type LoginDefinition = {
	text: string
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const LoginGoogle: FunctionComponent<LoginProps> = (props) => {
	const { context, definition } = props
	const clientIdKey = definition.clientId
	const clientIdValue = api.view.useConfigValue(clientIdKey)
	const buttonText = definition.text

	const responseGoogle = (response: GoogleLoginResponse): void => {
		api.signal.run(
			{
				signal: "user/LOGIN",
				type: "google",
				payload: {
					token: response.getAuthResponse().id_token,
				},
			},
			context
		)
	}

	//To-Do: show an error
	const responseGoogleFail = (error: Error): void => {
		console.log("Login Failed", error)
	}

	if (!clientIdValue) return null

	const { signIn } = useGoogleLogin({
		clientId: clientIdValue,
		onSuccess: responseGoogle,
		onFailure: responseGoogleFail,
		cookiePolicy: "single_host_origin",
		autoLoad: false,
	})

	const Button = component.getUtility("uesio/io.button")

	return (
		<LoginWrapper align={definition.align}>
			<Button
				context={context}
				onClick={signIn}
				variant="uesio/io.secondary"
				styles={{
					label: {
						textTransform: "none",
					},
				}}
				label={buttonText}
			/>
		</LoginWrapper>
	)
}

export default LoginGoogle
