import {
	GoogleLogin,
	GoogleLoginResponse,
	GoogleLoginProps,
} from "react-google-login"
import React, { ReactElement } from "react"
import { definition, hooks, material } from "@uesio/ui"
import LoginWrapper from "../loginhelpers/wrapper"
import { getButtonWidth } from "../loginhelpers/button"

type LoginDefinition = {
	text: string
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const useStyles = material.makeStyles(() =>
	material.createStyles({
		googleButton: {
			width: getButtonWidth(),
			paddingRight: "8px !important",
		},
	})
)

function LoginGoogle(props: LoginProps): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const clientIdKey = props.definition.clientId
	const clientIdValue = uesio.view.useConfigValue(clientIdKey)
	const classes = useStyles(props)
	const buttonText = props.definition.text

	if (!clientIdValue) return null

	const responseGoogle = async (
		response: GoogleLoginResponse
	): Promise<void> => {
		await uesio.signal.run(
			{
				band: "platform",
				signal: "LOGIN",
				data: {
					type: "google",
					token: response.getAuthResponse().id_token,
				},
			},
			props.context
		)
	}

	//To-Do: show an error
	const responseGoogleFail = async (error: Error): Promise<void> => {
		console.log("Login Failed", error)
	}

	const options: GoogleLoginProps = {
		clientId: clientIdValue,
		buttonText: buttonText,
		onSuccess: responseGoogle,
		onFailure: responseGoogleFail,
		cookiePolicy: "single_host_origin",
		className: classes.googleButton,
		autoLoad: false,
	}

	return (
		<LoginWrapper align={props.definition.align}>
			<GoogleLogin {...options} />
		</LoginWrapper>
	)
}

export default LoginGoogle
