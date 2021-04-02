// Had to do this for now because the library doesn't have typings if you
// want to use a totally custom button.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import FacebookLogin, {
	ReactFacebookLoginInfo,
} from "react-facebook-login/dist/facebook-login-render-props"
import LoginWrapper from "../../shared/loginwrapper"

type LoginDefinition = {
	text: string
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const LoginFacebook: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const facebookAppIdKey = props.definition.clientId
	const facebookAppId = uesio.view.useConfigValue(facebookAppIdKey)
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

	const Button = component.registry.getUtility("io", "button")

	return (
		<LoginWrapper align={props.definition.align}>
			<FacebookLogin
				appId={facebookAppId}
				autoLoad={false}
				fields="name,email"
				callback={responseFacebook}
				render={(renderProps) => (
					<Button
						{...props}
						onClick={renderProps.onClick}
						definition={{
							"uesio.variant": "io.secondary",
							"uesio.styles": {
								root: {
									width: "210px",
								},
								label: {
									textTransform: "none",
								},
							},
						}}
						label={buttonText}
					/>
				)}
			/>
		</LoginWrapper>
	)
}

export default LoginFacebook
