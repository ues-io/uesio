import { useGoogleLogin, GoogleLoginResponse } from "react-google-login"
import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
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
	const uesio = hooks.useUesio(props)
	const clientIdKey = props.definition.clientId
	const clientIdValue = uesio.view.useConfigValue(clientIdKey)
	const buttonText = props.definition.text

	const responseGoogle = (response: GoogleLoginResponse): void => {
		uesio.signal.run(
			{
				signal: "user/LOGIN",
				type: "google",
				token: response.getAuthResponse().id_token,
			},
			props.context
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

	const Button = component.registry.getUtility("io.button")

	return (
		<LoginWrapper align={props.definition.align}>
			<Button
				{...props}
				onClick={signIn}
				variant="io.secondary"
				styles={{
					root: {
						width: "210px",
					},
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
