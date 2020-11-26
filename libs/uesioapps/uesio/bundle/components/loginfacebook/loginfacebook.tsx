import React, { ReactElement } from "react"
import { definition, hooks, material } from "@uesio/ui"
import FacebookLogin, {
	ReactFacebookLoginInfo,
	ReactFacebookLoginProps,
} from "react-facebook-login"
import LoginIcon from "../loginhelpers/icon"
import LoginWrapper from "../loginhelpers/wrapper"
import { getButtonStyles } from "../loginhelpers/button"

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
		FacebookLoginButton: getButtonStyles(),
	})
)

function LoginFacebook(props: LoginProps): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const facebookAppIdKey = props.definition.clientId
	const facebookAppId = uesio.view.useConfigValue(facebookAppIdKey)
	const classes = useStyles(props)
	const buttonText = props.definition.text

	if (!facebookAppId) return null

	const responseFacebook = async (
		response: ReactFacebookLoginInfo
	): Promise<void> => {
		await uesio.signal.run(
			{
				band: "platform",
				signal: "LOGIN",
				data: {
					type: "facebook",
					token: response.accessToken,
				},
			},
			props.context
		)
	}

	const options: ReactFacebookLoginProps = {
		appId: facebookAppId,
		autoLoad: false,
		fields: "name,email",
		callback: responseFacebook,
		icon: <LoginIcon image="uesio.facebooksmall" />,
		textButton: buttonText,
		cssClass: classes.FacebookLoginButton,
	}

	return (
		<LoginWrapper align={props.definition.align}>
			<FacebookLogin {...options} />
		</LoginWrapper>
	)
}

export default LoginFacebook
