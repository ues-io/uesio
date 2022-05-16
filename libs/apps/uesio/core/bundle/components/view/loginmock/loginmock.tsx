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

const Button = component.registry.getUtility("uesio/io.button")
const Grid = component.registry.getUtility("uesio/io.grid")

const LoginMock: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition } = props
	const useMock = uesio.view.useConfigValue("uesio/core.mock_auth")

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
		<LoginWrapper align={definition.align}>
			<Grid
				styles={{
					root: {
						gridTemplateColumns: "1fr 1fr",
						columnGap: "10px",
						rowGap: "10px",
						paddingBottom: "20px",
					},
				}}
				context={context}
			>
				{mock.mockUsers.map((user) => (
					<Button
						key={user}
						context={context}
						onClick={(): void => {
							uesio.signal.run(
								{
									signal: "user/LOGIN",
									authSource: "uesio/core.mock",
									payload: {
										token: mock.getMockToken(user),
									},
								},
								context
							)
						}}
						variant="uesio/io.secondary"
						styles={{
							root: {
								backgroundColor: "white",
								width: "100%",
								display: "block",
							},
							label: {
								textTransform: "capitalize",
							},
						}}
						label={user}
					/>
				))}
			</Grid>
		</LoginWrapper>
	)
}

export default LoginMock
