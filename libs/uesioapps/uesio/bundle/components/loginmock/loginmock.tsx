import React, { ReactElement } from "react"
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

function LoginMock(props: LoginProps): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)
	const buttonText = props.definition.text

	return (
		<LoginWrapper align={props.definition.align}>
			<button
				onClick={async (): Promise<void> => {
					await uesio.signal.run(
						{
							band: "platform",
							signal: "LOGIN",
							data: {
								type: "mock",
								token: "mockToken",
							},
						},
						props.context
					)
				}}
				className={classes.loginButton}
			>
				<LoginIcon image="uesio.logosmall"></LoginIcon>
				<LoginText text={buttonText}></LoginText>
			</button>
		</LoginWrapper>
	)
}

export default LoginMock
