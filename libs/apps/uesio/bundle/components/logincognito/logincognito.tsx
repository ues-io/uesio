import React, { ReactElement, useState } from "react"
import { definition, material, hooks, component } from "uesio"
import LoginIcon from "../loginhelpers/icon"
import LoginWrapper from "../loginhelpers/wrapper"
import LoginText from "../loginhelpers/text"
import { getButtonStyles } from "../loginhelpers/button"
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

const useLoginStyles = material.makeStyles((theme) =>
	material.createStyles({
		loginButton: getButtonStyles(),
		formwrapper: {
			width: "300px",
			margin: "40px auto",
			textAlign: "center",
		},
		button: {
			margin: theme.spacing(2, 1),
		},
		textfield: {
			margin: theme.spacing(1, 0),
		},
		textbutton: {
			verticalAlign: "initial",
		},
		errormsg: {
			marginBottom: "10px",
		},
	})
)

type LoginButtonProps = {
	setMode: React.Dispatch<React.SetStateAction<string>>
	text: string
}

function getAuthDetails(
	username: string,
	password: string
): AuthenticationDetails {
	return new AuthenticationDetails({
		Username: username,
		Password: password,
	})
}

function getUser(username: string, pool: CognitoUserPool): CognitoUser {
	return new CognitoUser({
		Username: username,
		Pool: pool,
	})
}

function getPool(userPoolId: string, clientId: string): CognitoUserPool {
	return new CognitoUserPool({
		UserPoolId: userPoolId, // Your user pool id here
		ClientId: clientId, // Your client id here
	})
}

function LoginButton(props: LoginButtonProps): ReactElement {
	const classes = useLoginStyles(props)
	return (
		<button
			onClick={() => {
				props.setMode("login")
			}}
			className={classes.loginButton}
		>
			<LoginIcon image="uesio.amazonsmall"></LoginIcon>
			<LoginText text={props.text}></LoginText>
		</button>
	)
}

function LoginCognito(props: LoginProps): ReactElement | null {
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

	async function logIn(username: string, password: string): Promise<void> {
		const authenticationDetails = getAuthDetails(username, password)
		const cognitoUser = getUser(username, pool)
		cognitoUser.authenticateUser(authenticationDetails, {
			onSuccess: async function (result) {
				setMessage("")
				const accessToken = result.getIdToken().getJwtToken()
				await uesio.signal.run(
					{
						band: "platform",
						signal: "LOGIN",
						data: {
							type: "cognito",
							token: accessToken,
						},
					},
					props.context
				)
			},

			onFailure: function (err) {
				setMessage(err.message || JSON.stringify(err))
			},
		})
	}

	async function confirm(verificationCode: string): Promise<void> {
		const cognitoUser = getUser(signupUsername, pool)
		console.log("confirm?", verificationCode)
		cognitoUser.confirmRegistration(verificationCode, true, function (
			err,
			result
		) {
			if (err) {
				setMessage(err.message || JSON.stringify(err))
				return
			}
			if (result === "SUCCESS") {
				setMessage("")
				logIn(signupUsername, signupPassword)
			}
		})
	}

	async function signUp(
		firstname: string,
		lastname: string,
		username: string,
		email: string,
		password: string
	): Promise<void> {
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

		pool.signUp(username, password, attributeList, [], function (
			err,
			result
		) {
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
		})
	}

	const AlertComponent = component.registry.get("material", "alert")

	return (
		<div className={classes.formwrapper}>
			{message && (
				<AlertComponent
					{...props}
					{...{
						onClose: () => {
							setMessage("")
						},
						className: classes.errormsg,
						severity: "error",
					}}
				>
					{message}
				</AlertComponent>
			)}
			{mode === "" && (
				<LoginWrapper align={props.definition.align}>
					<LoginButton
						setMode={setMode}
						text={props.definition.text}
					></LoginButton>
				</LoginWrapper>
			)}
			{mode === "login" && (
				<LoginForm
					{...{
						setMode,
						logIn,
						setMessage,
					}}
				></LoginForm>
			)}
			{mode === "signup" && (
				<SignupForm
					{...{
						setMode,
						signupUsername,
						setSignupUsername,
						signupPassword,
						setSignupPassword,
						signUp,
					}}
				></SignupForm>
			)}
			{mode === "confirm" && (
				<ConfirmForm
					{...{
						setMode,
						confirm,
					}}
				></ConfirmForm>
			)}
		</div>
	)
}

export default LoginCognito

export { useLoginStyles }
