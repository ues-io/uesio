import { definition } from "@uesio/ui"
import {
	useState,
	ChangeEvent,
	FunctionComponent,
	Dispatch,
	SetStateAction,
} from "react"
import { TextField, Button } from "@material-ui/core"

import { useLoginStyles } from "./logincognito"

interface SignupFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	setSignupUsername: Dispatch<SetStateAction<string>>
	signupUsername: string
	setSignupPassword: Dispatch<SetStateAction<string>>
	signupPassword: string
	signUp: (
		firstname: string,
		lastname: string,
		username: string,
		email: string,
		password: string
	) => void
}

const SignupForm: FunctionComponent<SignupFormProps> = (props) => {
	const {
		signUp,
		setMode,
		setSignupUsername,
		setSignupPassword,
		signupUsername,
		signupPassword,
	} = props
	const classes = useLoginStyles(props)
	const [email, setEmail] = useState("")
	const [firstname, setFirstName] = useState("")
	const [lastname, setLastName] = useState("")

	return (
		<>
			<TextField
				label="First Name"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setFirstName(e.target.value)
				}
			/>
			<TextField
				label="Last Name"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setLastName(e.target.value)
				}
			/>
			<TextField
				label="Username"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setSignupUsername(e.target.value)
				}
			/>
			<TextField
				label="Email"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setEmail(e.target.value)
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
					setSignupPassword(e.target.value)
				}
			/>
			<Button onClick={() => setMode("")} className={classes.button}>
				Cancel
			</Button>
			<Button
				variant="contained"
				color="primary"
				className={classes.button}
				onClick={() => {
					signUp(
						firstname,
						lastname,
						signupUsername,
						email,
						signupPassword
					)
				}}
			>
				Create Account`
			</Button>
		</>
	)
}

export default SignupForm
