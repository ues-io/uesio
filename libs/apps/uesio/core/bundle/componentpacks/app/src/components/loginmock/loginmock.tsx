import { definition, api, component } from "@uesio/ui"

const LoginMock: definition.UC = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Grid = component.getUtility("uesio/io.grid")
	const { context } = props
	const useMock = api.view.useConfigValue("uesio/core.mock_auth")
	const mockUsernamesString = api.view.useConfigValue(
		"uesio/core.mock_auth_usernames"
	)

	if (
		useMock !== "true" ||
		!mockUsernamesString ||
		!mockUsernamesString.trim().length
	) {
		return null
	}

	return (
		<Grid className="grid-cols-2 gap-2" context={context}>
			{mockUsernamesString.split(",").map((user) => (
				<Button
					key={user}
					id={`${api.component.getComponentIdFromProps(
						props
					)}:mock-logi-${user}`}
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
