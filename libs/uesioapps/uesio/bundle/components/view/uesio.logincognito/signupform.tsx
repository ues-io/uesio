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

const FieldWrapper = component.registry.getUtility("io.fieldwrapper")
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
		context,
	} = props

	const [email, setEmail] = useState("")
	const [firstname, setFirstName] = useState("")
	const [lastname, setLastName] = useState("")

	return (
		<>
			<FieldWrapper context={context} label="First Name">
				<TextField
					value={firstname}
					setValue={setFirstName}
					context={context}
				/>
			</FieldWrapper>
			<FieldWrapper context={context} label="Last Name">
				<TextField
					value={lastname}
					setValue={setLastName}
					context={context}
				/>
			</FieldWrapper>
			<FieldWrapper context={context} label="Username">
				<TextField
					value={signupUsername}
					setValue={setSignupUsername}
					context={context}
				/>
			</FieldWrapper>
			<FieldWrapper context={context} label="Email">
				<TextField
					value={email}
					setValue={setEmail}
					context={context}
				/>
			</FieldWrapper>
			<FieldWrapper context={context} label="Password">
				<TextField
					value={signupPassword}
					setValue={setSignupPassword}
					context={context}
				/>
			</FieldWrapper>
			<Grid
				context={context}
				styles={{
					root: {
						gridTemplateColumns: "1fr 1fr",
						columnGap: "10px",
						padding: "20px 0",
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
					context={context}
					label="Create Account"
				/>
				<Button
					onClick={() => setMode("login")}
					context={context}
					variant="io.secondary"
					label="Cancel"
				/>
			</Grid>
		</>
	)
}

export default SignupForm
