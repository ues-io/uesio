import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import LoginWrapper from "../../shared/loginwrapper"
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import users from "../../../../../../../apps/platform/seed/users.json"
type LoginDefinition = {
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const LoginMock: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const Button = component.registry.getUtility("io.button")

	return (
		<>
			{users.map((user) => {
				const value = JSON.stringify({
					authType: user.federationType,
					lastname: user.lastname,
					firstname: user.firstname,
					subject: user.federationId,
					email:
						user.firstname.toLowerCase() + "@thecloudmasters.com",
				})
				return (
					<LoginWrapper align={props.definition.align}>
						<Button
							{...props}
							onClick={(): void => {
								uesio.signal.run(
									{
										signal: "user/LOGIN",
										type: "mock",
										token: value,
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
							label={"Sign in as " + user.firstname}
						/>
					</LoginWrapper>
				)
			})}
		</>
	)
}

export default LoginMock
