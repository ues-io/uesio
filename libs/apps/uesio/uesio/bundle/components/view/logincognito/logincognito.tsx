import { useState, FunctionComponent, Dispatch, SetStateAction } from "react"
import { definition, hooks, component, styles } from "@uesio/ui"
import LoginWrapper from "../../shared/loginwrapper"
import LoginForm from "./loginform"
import SignupForm from "./signupform"
import ConfirmForm from "./confirmform"
import { cognito } from "@uesio/loginhelpers"

type LoginDefinition = {
	text: string
	clientId: string
	poolId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const Button = component.registry.getUtility("io.button")

interface LoginButtonProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	text: string
}

const LoginButton: FunctionComponent<LoginButtonProps> = (props) => {
	const { text, setMode, context } = props
	return (
		<Button
			onClick={() => setMode("login")}
			variant="io.primary"
			styles={{
				root: {
					width: "210px",
				},
				label: {
					textTransform: "none",
				},
			}}
			label={text}
			context={context}
		/>
	)
}

const LoginCognito: FunctionComponent<LoginProps> = (props) => {
	const { context, definition, path } = props
	const uesio = hooks.useUesio(props)
	const classes = styles.useStyles(
		{
			formwrapper: {
				width: "300px",
				margin: "40px auto",
				textAlign: "center",
			},
			errormsg: {
				marginBottom: "10px",
			},
		},
		props
	)
	const clientIdKey = definition.clientId
	const clientId = uesio.view.useConfigValue(clientIdKey)
	const poolIdKey = definition.poolId
	const poolId = uesio.view.useConfigValue(poolIdKey)
	const [mode, setMode] = uesio.component.useState<string>("mode", "")
	const [signupEmail, setSignupEmail] = useState("")
	const [signupPassword, setSignupPassword] = useState("")

	if (!poolId || !clientId) return null
	const pool = cognito.getPool(poolId, clientId)

	function signUp(
		firstname: string,
		lastname: string,
		email: string,
		password: string
	): void {
		const attributeList = cognito.getAttributeList(
			email,
			lastname,
			firstname
		)

		pool.signUp(
			email,
			password,
			attributeList,
			[],
			(err: Error, result: unknown) => {
				if (err) {
					const message = err.message || JSON.stringify(err)
					uesio.notification.addError(message, context, path)
					return
				}
				if (!result) {
					uesio.notification.addError("No Result!", context, path)
					return
				}
				setMode("confirm")
			}
		)
	}

	function logIn(username: string, password: string): void {
		const authenticationDetails = cognito.getAuthDetails(username, password)
		const cognitoUser = cognito.getUser(username, pool)
		cognitoUser.authenticateUser(authenticationDetails, {
			onSuccess: (result) => {
				const accessToken = result.getIdToken().getJwtToken()
				uesio.signal.run(
					{
						signal: "user/LOGIN",
						type: "cognito",
						token: accessToken,
					},
					context
				)
			},

			onFailure: (err) => {
				const message = err.message || JSON.stringify(err)
				uesio.notification.addError(message, context, path)
			},
		})
	}

	function confirm(verificationCode: string): void {
		const cognitoUser = cognito.getUser(signupEmail, pool)
		cognitoUser.confirmRegistration(
			verificationCode,
			true,
			(err, result) => {
				if (err) {
					const message = err.message || JSON.stringify(err)
					uesio.notification.addError(message, context, path)
					return
				}
				if (result === "SUCCESS") {
					logIn(signupEmail, signupPassword)
				}
			}
		)
	}

	return (
		<div className={classes.formwrapper}>
			<component.NotificationArea context={context} path={path} />
			{mode === "" && (
				<LoginWrapper align={definition.align}>
					<LoginButton
						setMode={setMode}
						text={definition.text}
						context={context}
					/>
				</LoginWrapper>
			)}
			{mode === "login" && (
				<LoginForm setMode={setMode} logIn={logIn} context={context} />
			)}
			{mode === "signup" && (
				<SignupForm
					setMode={setMode}
					signupEmail={signupEmail}
					setSignupEmail={setSignupEmail}
					signupPassword={signupPassword}
					setSignupPassword={setSignupPassword}
					signUp={signUp}
					context={context}
				/>
			)}
			{mode === "confirm" && (
				<ConfirmForm
					setMode={setMode}
					confirm={confirm}
					context={context}
				/>
			)}
		</div>
	)
}

export default LoginCognito
