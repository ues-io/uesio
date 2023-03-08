import { FunctionComponent } from "react"
import { definition, api, component } from "@uesio/ui"
import LoginWrapper from "../../shared/loginwrapper"
type LoginDefinition = {
	clientId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const MockUsernames = ["ben", "abel", "wessel", "gregg", "zach", "uesio"]

const LoginMock: FunctionComponent<LoginProps> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Grid = component.getUtility("uesio/io.grid")
	const { context, definition, path } = props
	const useMock = api.view.useConfigValue("uesio/core.mock_auth")

	if (useMock !== "true") {
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
				{MockUsernames.map((user) => (
					<Button
						key={user}
						id={api.component.getComponentId(
							`mock-login-${user}`,
							"uesio/core.loginmock",
							path,
							context
						)}
						context={context}
						onClick={(): void => {
							api.signal.run(
								{
									signal: "user/LOGIN",
									authSource: "uesio/core.mock",
									payload: {
										token: JSON.stringify({
											subject: user,
										}),
									},
								},
								context
							)
						}}
						variant="uesio/io.secondary"
						styles={{
							root: {
								backgroundColor: "white",
								minWidth: "unset",
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
