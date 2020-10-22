import { material } from "uesio"
import React, { ReactElement, useState, ChangeEvent } from "react"
import { useLoginStyles } from "./logincognito"

type LoginFormProps = {
	setMode: React.Dispatch<React.SetStateAction<string>>
	setMessage: React.Dispatch<React.SetStateAction<string>>
	logIn: (username: string, password: string) => Promise<void>
}

function LoginForm(props: LoginFormProps): ReactElement {
	const classes = useLoginStyles(props)

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
			></material.TextField>
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
			></material.TextField>
			<material.Button
				onClick={() => {
					props.setMode("")
					props.setMessage("")
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
					props.logIn(username, password)
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
					onClick={() => {
						console.info("I'm a button.")
					}}
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
						props.setMode("signup")
						props.setMessage("")
					}}
				>
					Create account
				</material.Link>
			</div>
		</>
	)
}

export default LoginForm
