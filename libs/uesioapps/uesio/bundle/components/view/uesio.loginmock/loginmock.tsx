import React, { ChangeEvent, FunctionComponent, useState } from "react"
import { definition, hooks, component } from "@uesio/ui"
import * as material from "@material-ui/core"
import LoginWrapper from "../../shared/loginwrapper"

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
				<material.InputLabel id="demo-simple-select-outlined-label">
					Mocked User
				</material.InputLabel>
				<material.Select
					labelId="demo-simple-select-outlined-label"
					id="demo-simple-select-outlined"
					value={name}
					onChange={(event: ChangeEvent<HTMLInputElement>) =>
						setName(event.target.value)
					}
					label="Mocked User"
				>
					<material.MenuItem value="">
						<em>None</em>
					</material.MenuItem>
					<material.MenuItem value={"Ben"}>
						Ben (Maintainer)
					</material.MenuItem>
					<material.MenuItem value={"Abel"}>
						Abel (Team member)
					</material.MenuItem>
					<material.MenuItem value={"Jackson"}>
						Jackson (Contributor)
					</material.MenuItem>
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
