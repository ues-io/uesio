import React, {
	useState,
	FunctionComponent,
	Dispatch,
	SetStateAction,
} from "react"
import { definition, hooks, component, styles } from "@uesio/ui"
import LoginWrapper from "../loginhelpers/wrapper"
import LoginForm from "./loginform"
import SignupForm from "./signupform"
import ConfirmForm from "./confirmform"

import {
	AuthenticationDetails,
	CognitoUserPool,
	CognitoUser,
	CognitoUserAttribute,
} from "amazon-cognito-identity-js"

type LoginDefinition = {
	text: string
	clientId: string
	poolId: string
	align: "left" | "center" | "right"
}

interface LoginProps extends definition.BaseProps {
	definition: LoginDefinition
}

const useLoginStyles = styles.getUseStyles(
	["formwrapper", "button", "textfield", "textbutton", "errormsg"],
	{
		formwrapper: {
			width: "300px",
			margin: "40px auto",
			textAlign: "center",
		},
		button: (props: definition.BaseProps) => ({
			margin: styles.getSpacing(props.context.getTheme(), 2, 1),
		}),
		textfield: (props: definition.BaseProps) => ({
			margin: styles.getSpacing(props.context.getTheme(), 1, 0),
		}),
		textbutton: {
			verticalAlign: "initial",
		},
		errormsg: {
			marginBottom: "10px",
		},
	}
)

interface LoginButtonProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	text: string
}

const getAuthDetails = (
	username: string,
	password: string
): AuthenticationDetails =>
	new AuthenticationDetails({
		Username: username,
		Password: password,
	})

const getUser = (username: string, pool: CognitoUserPool): CognitoUser =>
	new CognitoUser({
		Username: username,
		Pool: pool,
	})

const getPool = (userPoolId: string, clientId: string): CognitoUserPool =>
	new CognitoUserPool({
		UserPoolId: userPoolId, // Your user pool id here
		ClientId: clientId, // Your client id here
	})

const LoginButton: FunctionComponent<LoginButtonProps> = (props) => {
	const { text, setMode } = props
	const Button = component.registry.getUtility("io", "button")
	return (
		<Button
			{...props}
			onClick={() => setMode("login")}
			definition={{
				"uesio.variant": "io.primary",
				"uesio.styles": {
					root: {
						width: "210px",
					},
				},
			}}
			label={text}
		/>
	)
}

const signUp = (
	pool: CognitoUserPool,
	setMessage: (message: string) => void,
	setMode: (message: string) => void
) => (
	firstname: string,
	lastname: string,
	username: string,
	email: string,
	password: string
): void => {
	const attributeList = [
		new CognitoUserAttribute({
			Name: "email",
			Value: email,
		}),
		new CognitoUserAttribute({
			Name: "family_name",
			Value: lastname,
		}),
		new CognitoUserAttribute({
			Name: "given_name",
			Value: firstname,
		}),
	]

	pool.signUp(
		username,
		password,
		attributeList,
		[],
		(err: Error, result: unknown) => {
			if (err) {
				setMessage(err.message || JSON.stringify(err))
				return
			}
			if (!result) {
				setMessage("No result!")
				return
			}
			setMessage("")
			setMode("confirm")
		}
	)
}

const LoginCognito: FunctionComponent<LoginProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const classes = useLoginStyles(props)
	const clientIdKey = props.definition.clientId
	const clientId = uesio.view.useConfigValue(clientIdKey)
	const poolIdKey = props.definition.poolId
	const poolId = uesio.view.useConfigValue(poolIdKey)
	const [mode, setMode] = useState("")
	const [signupUsername, setSignupUsername] = useState("")
	const [signupPassword, setSignupPassword] = useState("")

	const [message, setMessage] = useState("")

	if (!poolId || !clientId) return null
	const pool = getPool(poolId, clientId)

	function logIn(username: string, password: string): void {
		const authenticationDetails = getAuthDetails(username, password)
		const cognitoUser = getUser(username, pool)
		cognitoUser.authenticateUser(authenticationDetails, {
			onSuccess: (result) => {
				setMessage("")
				const accessToken = result.getIdToken().getJwtToken()
				uesio.signal.run(
					{
						signal: "user/LOGIN",
						type: "cognito",
						token: accessToken,
					},
					props.context
				)
			},

			onFailure: (err) => {
				setMessage(err.message || JSON.stringify(err))
			},
		})
	}

	function confirm(verificationCode: string): void {
		const cognitoUser = getUser(signupUsername, pool)
		cognitoUser.confirmRegistration(
			verificationCode,
			true,
			(err, result) => {
				if (err) {
					setMessage(err.message || JSON.stringify(err))
					return
				}
				if (result === "SUCCESS") {
					setMessage("")
					logIn(signupUsername, signupPassword)
				}
			}
		)
	}

	const AlertComponent = component.registry.getUtility("material", "alert")

	return (
		<div className={classes.formwrapper}>
			{message && (
				<AlertComponent
					{...props}
					onClose={() => setMessage("")}
					className={classes.errormsg}
					severity="error"
				>
					{message}
				</AlertComponent>
			)}
			{mode === "" && (
				<LoginWrapper align={props.definition.align}>
					<LoginButton
						setMode={setMode}
						text={props.definition.text}
						{...props}
					/>
				</LoginWrapper>
			)}
			{mode === "login" && (
				<LoginForm
					setMode={setMode}
					logIn={logIn}
					setMessage={setMessage}
					{...props}
				/>
			)}
			{mode === "signup" && (
				<SignupForm
					setMode={setMode}
					signupUsername={signupUsername}
					setSignupUsername={setSignupUsername}
					signupPassword={signupPassword}
					setSignupPassword={setSignupPassword}
					signUp={signUp(pool, setMessage, setMode)}
					{...props}
				/>
			)}
			{mode === "confirm" && (
				<ConfirmForm setMode={setMode} confirm={confirm} {...props} />
			)}
		</div>
	)
}

export default LoginCognito

export { useLoginStyles }
