import { definition, component } from "@uesio/ui"
import { useState, FunctionComponent, Dispatch, SetStateAction } from "react"

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

const TextField = component.registry.getUtility("io.textfield")
const Button = component.registry.getUtility("io.button")
const Grid = component.registry.getUtility("io.grid")

const SignupForm: FunctionComponent<SignupFormProps> = (props) => {
	const {
		signUp,
		setMode,
		setSignupUsername,
		setSignupPassword,
		signupUsername,
		signupPassword,
	} = props

	const [email, setEmail] = useState("")
	const [firstname, setFirstName] = useState("")
	const [lastname, setLastName] = useState("")

	return (
		<>
			<TextField label="First Name" setValue={setFirstName} {...props} />
			<TextField label="Last Name" setValue={setLastName} {...props} />
			<TextField
				label="Username"
				setValue={setSignupUsername}
				{...props}
			/>
			<TextField label="Email" setValue={setEmail} {...props} />
			<TextField
				label="Password"
				setValue={setSignupPassword}
				{...props}
			/>
			<Grid
				{...props}
				styles={{
					root: {
						gridTemplateColumns: "1fr 1fr",
						columnGap: "10px",
						padding: "20px 10px",
					},
				}}
			>
				<Button
					onClick={() => {
						signUp(
							firstname,
							lastname,
							signupUsername,
							email,
							signupPassword
						)
					}}
					variant="io.primary"
					{...props}
					label="Create Account"
				/>
				<Button
					onClick={() => setMode("login")}
					{...props}
					variant="io.secondary"
					label="Cancel"
				/>
			</Grid>
		</>
	)
}

export default SignupForm
