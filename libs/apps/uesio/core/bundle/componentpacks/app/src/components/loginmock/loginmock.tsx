import { definition, api, component } from "@uesio/ui"

const MockUsernames = ["ben", "abel", "wessel", "baxter", "zach", "uesio"]

const LoginMock: definition.UC = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Grid = component.getUtility("uesio/io.grid")
	const { context, path } = props
	const useMock = api.view.useConfigValue("uesio/core.mock_auth")

	if (useMock !== "true") {
		return null
	}

	return (
		<Grid className="grid-cols-2 gap-2" context={context}>
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
									token: user,
								},
							},
							context
						)
					}}
					variant="uesio/io.secondary"
					styleTokens={{
						root: ["bg-white", "min-w-min", "capitalize"],
					}}
					label={user}
				/>
			))}
		</Grid>
	)
}

export default LoginMock
