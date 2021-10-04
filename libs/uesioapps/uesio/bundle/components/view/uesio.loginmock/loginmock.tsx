import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import LoginWrapper from "../../shared/loginwrapper"
type LoginDefinition = {
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const mockUsers = [
	{ firstname: "Ben", lastname: "Hubbard" },
	{ firstname: "Abel", lastname: "Jimenez Molla" },
	{ firstname: "Wessel", lastname: "van der Plas" },
	{ firstname: "Gregg", lastname: "Baxter" },
]

const Button = component.registry.getUtility("io.button")

const LoginMock: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition } = props
	const useMock = uesio.view.useConfigValue("uesio.mock_auth")

	if (useMock !== "true") {
		return null
	}

	const mode = uesio.component.useExternalState(
		context.getViewId() || "",
		"uesio.logincognito",
		"mode"
	)

	if (mode) {
		return null
	}

	return (
		<>
			{mockUsers.map((user) => {
				const value = JSON.stringify({
					authType: "mock",
					lastname: user.lastname,
					firstname: user.firstname,
					subject: "Mock" + user.firstname,
					email:
						user.firstname.toLowerCase() + "@thecloudmasters.com",
				})
				return (
					<LoginWrapper align={definition.align}>
						<Button
							context={context}
							onClick={(): void => {
								uesio.signal.run(
									{
										signal: "user/LOGIN",
										type: "mock",
										token: value,
									},
									context
								)
							}}
							variant="io.secondary"
							styles={{
								root: {
									width: "210px",
									backgroundColor: "white",
								},
								label: {
									textTransform: "none",
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
