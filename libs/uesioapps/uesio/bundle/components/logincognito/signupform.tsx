import { material } from "@uesio/ui"
import React, { useState, ChangeEvent, FunctionComponent } from "react"
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
	) => void
}

const SignupForm: FunctionComponent<SignupFormProps> = ({
	signUp,
	setMode,
	setSignupUsername,
	setSignupPassword,
	signupUsername,
	signupPassword,
}) => {
	const classes = useLoginStyles()
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
			/>
			<material.TextField
				label="Last Name"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setLastName(e.target.value)
				}
			/>
			<material.TextField
				label="Username"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setSignupUsername(e.target.value)
				}
			/>
			<material.TextField
				label="Email"
				variant="outlined"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setEmail(e.target.value)
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
					setSignupPassword(e.target.value)
				}
			/>
			<material.Button
				onClick={() => setMode("")}
				className={classes.button}
			>
				Cancel
			</material.Button>
			<material.Button
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
				Create Account
			</material.Button>
		</>
	)
}

export default SignupForm
