import React, { FunctionComponent } from "react"
import { definition, hooks, material } from "@uesio/ui"
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

const useStyles = material.makeStyles(() =>
	material.createStyles({
		loginButton: getButtonStyles(),
	})
)

const LoginMock: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const classes = useStyles()
	const buttonText = props.definition.text

	return (
		<LoginWrapper align={props.definition.align}>
			<button
				onClick={async (): Promise<void> => {
					await uesio.signal.run(
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
				<LoginIcon image="uesio.logosmall" />
				<LoginText text={buttonText} />
			</button>
		</LoginWrapper>
	)
}

export default LoginMock
