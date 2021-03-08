import React, { ChangeEvent, FunctionComponent, useState } from "react"
import { definition, hooks, component } from "@uesio/ui"
import * as material from "@material-ui/core"
import LoginWrapper from "../../shared/loginwrapper"
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import users from "../../../../../../../apps/platform/seed/users.json"
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
	const [name, setName] = useState("")
	const Button = component.registry.getUtility("io.button")

	return (
		<LoginWrapper align={props.definition.align}>
			<material.FormControl variant="outlined">
				<material.InputLabel id="mocked-user-label">
					Mocked User
				</material.InputLabel>
				<material.Select
					labelId="mocked-user-label"
					id="mocked-users"
					value={name}
					onChange={(event: ChangeEvent<HTMLInputElement>) =>
						setName(event.target.value)
					}
					label="Mocked User"
				>
					<material.MenuItem value="">
						<em>None</em>
					</material.MenuItem>
					{users.map((user) => {
						const value = JSON.stringify({
							authType: user.federationType,
							lastname: user.lastname,
							firstname: user.firstname,
							subject: user.federationId,
							email:
								user.firstname.toLowerCase() +
								"@thecloudmasters.com",
						})
						return (
							<material.MenuItem value={value}>
								{user.firstname} ({user.uiDescriptor})
							</material.MenuItem>
						)
					})}
				</material.Select>
				<Button
					{...props}
					{...(name ? {} : { disabled: true })}
					onClick={(): void => {
						uesio.signal.run(
							{
								signal: "user/LOGIN",
								type: "mock",
								token: name,
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
			</material.FormControl>
		</LoginWrapper>
	)
}

export default LoginMock
