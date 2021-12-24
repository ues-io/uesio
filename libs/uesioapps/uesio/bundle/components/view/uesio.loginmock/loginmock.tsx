import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import { mock } from "@uesio/loginhelpers"
import LoginWrapper from "../../shared/loginwrapper"
type LoginDefinition = {
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

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
			{mock.mockUsers.map((user) => (
				<LoginWrapper
					key={user.lastname + user.firstname}
					align={definition.align}
				>
					<Button
						context={context}
						onClick={(): void => {
							uesio.signal.run(
								{
									signal: "user/LOGIN",
									type: "mock",
									token: mock.getMockToken(user),
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
			))}
		</>
	)
}

export default LoginMock
