import { FunctionComponent } from "react"
import { definition, hooks, material } from "@uesio/ui"
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

const useStyles = material.makeStyles(() =>
	material.createStyles({
		FacebookLoginButton: getButtonStyles(),
	})
)

const LoginFacebook: FunctionComponent<LoginProps> = (props) => {
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
				icon={<LoginIcon image="uesio.facebooksmall" />}
				textButton={buttonText}
				cssClass={classes.FacebookLoginButton}
			/>
		</LoginWrapper>
	)
}

export default LoginFacebook
