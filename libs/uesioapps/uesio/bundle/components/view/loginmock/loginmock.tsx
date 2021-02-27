import React, { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import LoginWrapper from "../loginhelpers/wrapper"

type LoginDefinition = {
	text: string
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const LoginMock: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const buttonText = props.definition.text

	const Button = component.registry.getUtility("io", "button")

	return (
		<LoginWrapper align={props.definition.align}>
			<Button
				{...props}
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
				definition={{
					"uesio.variant": "io.secondary",
					"uesio.styles": {
						root: {
							width: "210px",
						},
					},
				}}
				label={buttonText}
			/>
		</LoginWrapper>
	)
}

export default LoginMock
