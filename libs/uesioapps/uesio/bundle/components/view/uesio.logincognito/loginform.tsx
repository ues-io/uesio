import { definition, component } from "@uesio/ui"
import { FunctionComponent, useState, Dispatch, SetStateAction } from "react"

interface LoginFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	setMessage: Dispatch<SetStateAction<string>>
	logIn: (username: string, password: string) => void
}

const TextField = component.registry.getUtility("io.textfield")
const Button = component.registry.getUtility("io.button")
const Grid = component.registry.getUtility("io.grid")
const Text = component.registry.getUtility("io.text")
const Link = component.registry.getUtility("io.link")

const LoginForm: FunctionComponent<LoginFormProps> = (props) => {
	const { setMode, setMessage, logIn, context } = props
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")

	return (
		<>
			<TextField
				context={context}
				label="Username"
				setValue={setUsername}
			/>
			<TextField
				context={context}
				label="Password"
				setValue={setPassword}
			/>
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
						setMessage("")
					}}
				/>
			</Grid>
			<div>
				<Text context={context} text="Forgot your password?&nbsp;" />
				<Link
					context={context}
					onClick={() => {
						// not implemented
					}}
					text="Reset Password"
				/>
			</div>
			<div>
				<Text context={context} text="No Account?&nbsp;" />
				<Link
					context={context}
					onClick={() => {
						setMode("signup")
						setMessage("")
					}}
					text="Create Acount"
				/>
			</div>
		</>
	)
}

export default LoginForm
