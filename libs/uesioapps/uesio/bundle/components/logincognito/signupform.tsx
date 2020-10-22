import { material } from "uesio"
import React, { ReactElement, useState, ChangeEvent } from "react"
import { useLoginStyles } from "./logincognito"

type SignupFormProps = {
	setMode: React.Dispatch<React.SetStateAction<string>>
	setSignupUsername: React.Dispatch<React.SetStateAction<string>>
	signupUsername: string
	setSignupPassword: React.Dispatch<React.SetStateAction<string>>
	signupPassword: string
	signUp: (
		firstname: string,
		lastname: string,
		username: string,
		email: string,
		password: string
	) => Promise<void>
}

function SignupForm(props: SignupFormProps): ReactElement {
	const classes = useLoginStyles(props)
	const [email, setEmail] = useState("")
	const [firstname, setFirstName] = useState("")
	const [lastname, setLastName] = useState("")

	return (
		<>
			<material.TextField
				label="First Name"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setFirstName(e.target.value)
				}
			></material.TextField>
			<material.TextField
				label="Last Name"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setLastName(e.target.value)
				}
			></material.TextField>
			<material.TextField
				label="Username"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					props.setSignupUsername(e.target.value)
				}
			></material.TextField>
			<material.TextField
				label="Email"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setEmail(e.target.value)
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
					props.setSignupPassword(e.target.value)
				}
			></material.TextField>
			<material.Button
				onClick={() => {
					props.setMode("")
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
					props.signUp(
						firstname,
						lastname,
						props.signupUsername,
						email,
						props.signupPassword
					)
				}}
			>
				Create Account
			</material.Button>
		</>
	)
}

export default SignupForm
