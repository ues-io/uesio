import React, { FunctionComponent } from "react"
import { definition, hooks, styles } from "@uesio/ui"
import LoginIcon from "../loginhelpers/icon"
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

const LoginMock: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)
	const buttonText = props.definition.text

	return (
		<LoginWrapper align={props.definition.align}>
			<button
				onClick={(): void => {
					uesio.signal.run(
						{
							signal: "user/LOGIN",
							type: "mock",
							token: "mockToken",
						},
						props.context
					)
				}}
				className={classes.loginButton}
			>
				<LoginIcon image="uesio.logosmall" {...props} />
				<LoginText text={buttonText} {...props} />
			</button>
		</LoginWrapper>
	)
}

export default LoginMock
