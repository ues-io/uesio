import { definition, component } from "@uesio/ui"
import { FunctionComponent, Dispatch, SetStateAction } from "react"

interface SignupFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	setSignupEmail: Dispatch<SetStateAction<string>>
	signupEmail: string
	setSignupPassword: Dispatch<SetStateAction<string>>
	signupPassword: string
	setUsername: Dispatch<SetStateAction<string>>
	signupUsername: string
	signUp: (username: string, email: string, password: string) => void
}

const FieldWrapper = component.registry.getUtility("io.fieldwrapper")
const TextField = component.registry.getUtility("io.textfield")
const Button = component.registry.getUtility("io.button")
const Grid = component.registry.getUtility("io.grid")

const SignupForm: FunctionComponent<SignupFormProps> = (props) => {
	const {
		signUp,
		setMode,
		setSignupEmail,
		setSignupPassword,
		setUsername,
		signupUsername,
		signupEmail,
		signupPassword,
		context,
	} = props

	return (
		<>
			<FieldWrapper context={context} label="Username">
				<TextField
					value={signupUsername}
					setValue={setUsername}
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
						signUp(signupUsername, signupEmail, signupPassword)
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
