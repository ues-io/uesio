import { definition, component } from "@uesio/ui"
import { useState, FunctionComponent, Dispatch, SetStateAction } from "react"

interface SignupFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	setSignupEmail: Dispatch<SetStateAction<string>>
	signupEmail: string
	setSignupPassword: Dispatch<SetStateAction<string>>
	signupPassword: string
	signUp: (
		firstname: string,
		lastname: string,
		email: string,
		password: string
	) => void
}

const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")
const TextField = component.registry.getUtility("uesio/io.textfield")
const Button = component.registry.getUtility("uesio/io.button")
const Grid = component.registry.getUtility("uesio/io.grid")

const SignupForm: FunctionComponent<SignupFormProps> = (props) => {
	const {
		signUp,
		setMode,
		setSignupEmail,
		setSignupPassword,
		signupEmail,
		signupPassword,
		context,
	} = props

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
			<FieldWrapper context={context} label="Email">
				<TextField
					value={signupEmail}
					setValue={setSignupEmail}
					context={context}
				/>
			</FieldWrapper>
			<FieldWrapper context={context} label="Password">
				<TextField
					value={signupPassword}
					setValue={setSignupPassword}
					context={context}
					password
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
						signUp(firstname, lastname, signupEmail, signupPassword)
					}}
					variant="uesio/io.primary"
					context={context}
					label="Create Account"
				/>
				<Button
					onClick={() => setMode("login")}
					context={context}
					variant="uesio/io.secondary"
					label="Cancel"
				/>
			</Grid>
		</>
	)
}

export default SignupForm
