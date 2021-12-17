import { definition, component } from "@uesio/ui"
import { FunctionComponent, useState, Dispatch, SetStateAction } from "react"

interface LoginFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	logIn: (username: string, password: string) => void
}

const TextField = component.registry.getUtility("io.textfield")
const FieldWrapper = component.registry.getUtility("io.fieldwrapper")
const Button = component.registry.getUtility("io.button")
const Grid = component.registry.getUtility("io.grid")
const Text = component.registry.getUtility("io.text")
const Link = component.registry.getUtility("io.link")

const LoginForm: FunctionComponent<LoginFormProps> = (props) => {
	const { setMode, logIn, context } = props
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")

	return (
		<>
			<FieldWrapper context={context} label="Username">
				<TextField context={context} setValue={setUsername} />
			</FieldWrapper>
			<FieldWrapper context={context} label="Password">
				<TextField context={context} setValue={setPassword} />
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
					context={context}
					variant="io.primary"
					label="Sign In"
					onClick={() => logIn(username, password)}
				/>
				<Button
					context={context}
					label="Cancel"
					variant="io.secondary"
					onClick={() => {
						setMode("")
					}}
				/>
			</Grid>
			<div>
				<Text
					variant="io.aside"
					context={context}
					text="Forgot your password?&nbsp;"
				/>
				<Link
					context={context}
					onClick={() => {
						// not implemented
					}}
					text="Reset Password"
				/>
			</div>
			<div>
				<Text
					variant="io.aside"
					context={context}
					text="No Account?&nbsp;"
				/>
				<Link
					context={context}
					onClick={() => {
						setMode("signup")
					}}
					text="Create Acount"
				/>
			</div>
		</>
	)
}

export default LoginForm
