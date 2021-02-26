import { useGoogleLogin, GoogleLoginResponse } from "react-google-login"
import React, { FunctionComponent } from "react"
import { definition, hooks, styles } from "@uesio/ui"
import LoginWrapper from "../loginhelpers/wrapper"
import { getButtonStyles } from "../loginhelpers/button"
import LoginText from "../loginhelpers/text"

type LoginDefinition = {
	text: string
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const useStyles = styles.getUseStyles(["loginButton"], {
	loginButton: getButtonStyles(),
})

const LoginGoogle: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const clientIdKey = props.definition.clientId
	const clientIdValue = uesio.view.useConfigValue(clientIdKey)
	const classes = useStyles(props)
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

	const { signIn } = useGoogleLogin({
		clientId: clientIdValue,
		onSuccess: responseGoogle,
		onFailure: responseGoogleFail,
		cookiePolicy: "single_host_origin",
		autoLoad: false,
	})

	if (!clientIdValue) return null

	return (
		<LoginWrapper align={props.definition.align}>
			<button onClick={signIn} className={classes.loginButton}>
				<LoginText text={buttonText} {...props} />
			</button>
		</LoginWrapper>
	)
}

export default LoginGoogle
