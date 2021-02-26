import React, { FunctionComponent } from "react"
import { definition, hooks, styles } from "@uesio/ui"
import FacebookLogin, { ReactFacebookLoginInfo } from "react-facebook-login"
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

const useStyles = styles.getUseStyles(["facebookLoginButton"], {
	facebookLoginButton: getButtonStyles(),
})

const LoginFacebook: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const facebookAppIdKey = props.definition.clientId
	const facebookAppId = uesio.view.useConfigValue(facebookAppIdKey)
	const classes = useStyles(props)
	const buttonText = props.definition.text

	if (!facebookAppId) return null

	const responseFacebook = (response: ReactFacebookLoginInfo): void => {
		uesio.signal.run(
			{
				signal: "user/LOGIN",
				type: "facebook",
				token: response.accessToken,
			},
			props.context
		)
	}

	return (
		<LoginWrapper align={props.definition.align}>
			<FacebookLogin
				appId={facebookAppId}
				autoLoad={false}
				fields="name,email"
				callback={responseFacebook}
				icon={<LoginIcon image="uesio.facebooksmall" {...props} />}
				textButton={buttonText}
				cssClass={classes.facebookLoginButton}
			/>
		</LoginWrapper>
	)
}

export default LoginFacebook
