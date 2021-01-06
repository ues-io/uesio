import { material } from "@uesio/ui"
import React, { FunctionComponent, useState, ChangeEvent } from "react"
import { useLoginStyles } from "./logincognito"

type LoginFormProps = {
	setMode: React.Dispatch<React.SetStateAction<string>>
	setMessage: React.Dispatch<React.SetStateAction<string>>
	logIn: (username: string, password: string) => Promise<void>
}

const LoginForm: FunctionComponent<LoginFormProps> = ({
	setMode,
	setMessage,
	logIn,
}) => {
	const classes = useLoginStyles()
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")

	return (
		<>
			<material.TextField
				label="Username"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setUsername(e.target.value)
				}
			/>
			<material.TextField
				label="Password"
				variant="outlined"
				type="password"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setPassword(e.target.value)
				}
			/>
			<material.Button
				onClick={() => {
					setMode("")
					setMessage("")
				}}
				className={classes.button}
			>
				Cancel
			</material.Button>
			<material.Button
				variant="contained"
				color="primary"
				className={classes.button}
				onClick={() => {
					logIn(username, password)
				}}
			>
				Sign In
			</material.Button>
			<div>
				<material.Typography variant="body2" component="span">
					Forgot your password?&nbsp;
				</material.Typography>
				<material.Link
					component="button"
					variant="body2"
					className={classes.textbutton}
					onClick={() => console.info("I'm a button.")}
				>
					Reset password
				</material.Link>
			</div>
			<div>
				<material.Typography variant="body2" component="span">
					No Account?&nbsp;
				</material.Typography>
				<material.Link
					component="button"
					variant="body2"
					className={classes.textbutton}
					onClick={() => {
						setMode("signup")
						setMessage("")
					}}
				>
					Create account
				</material.Link>
			</div>
		</>
	)
}

export default LoginForm
