import { definition } from "@uesio/ui"
import React, {
	FunctionComponent,
	useState,
	ChangeEvent,
	Dispatch,
	SetStateAction,
} from "react"
import { TextField, Button, Typography, Link } from "@material-ui/core"
import { useLoginStyles } from "./logincognito"

interface LoginFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	setMessage: Dispatch<SetStateAction<string>>
	logIn: (username: string, password: string) => void
}

const LoginForm: FunctionComponent<LoginFormProps> = (props) => {
	const { setMode, setMessage, logIn } = props
	const classes = useLoginStyles(props)
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")

	return (
		<>
			<TextField
				label="Username"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setUsername(e.target.value)
				}
			/>
			<TextField
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
			<Button
				onClick={() => {
					setMode("")
					setMessage("")
				}}
				className={classes.button}
			>
				Cancel
			</Button>
			<Button
				variant="contained"
				color="primary"
				className={classes.button}
				onClick={() => logIn(username, password)}
			>
				Sign In
			</Button>
			<div>
				<Typography variant="body2" component="span">
					Forgot your password?&nbsp;
				</Typography>
				<Link
					component="button"
					variant="body2"
					className={classes.textbutton}
					onClick={() => console.info("I'm a button.")}
				>
					Reset password
				</Link>
			</div>
			<div>
				<Typography variant="body2" component="span">
					No Account?&nbsp;
				</Typography>
				<Link
					component="button"
					variant="body2"
					className={classes.textbutton}
					onClick={() => {
						setMode("signup")
						setMessage("")
					}}
				>
					Create account
				</Link>
			</div>
		</>
	)
}

export default LoginForm
