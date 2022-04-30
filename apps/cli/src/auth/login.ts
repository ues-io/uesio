import { Response } from "node-fetch"
import { get, post } from "../request/request"
import { getSessionId, setSessionId } from "../config/config"
import inquirer from "inquirer"
import { platform, component } from "#uesio/ui"

// Using # here because it's a subpath import
import { cognito, mock } from "#uesio/loginhelpers"

type AuthHandlerResponse = {
	token: string
}

type AuthHandler = () => Promise<AuthHandlerResponse>

type AuthCheckResponse = {
	user: User
}

type User = {
	firstname: string
	lastname: string
	profile: string
	site: string
	cookie: string
	id: string
}

type AuthHandlers = {
	[key: string]: AuthHandler
}

const SESSION_KEY = "sessid"

const authHandlers = {
	["uesio/core.mock"]: async (): Promise<AuthHandlerResponse> => ({
		// TODO: actually read from seeds and allow mock login as all users
		token: mock.getMockToken("ben"),
	}),
	["uesio/core.platform"]: async (): Promise<AuthHandlerResponse> => {
		const responses = await inquirer.prompt([
			{
				name: "username",
				message: "Username",
				type: "input",
			},
			{
				name: "password",
				message: "Password",
				type: "input",
			},
		])

		const poolIdResponse = await get(
			"/site/configvalues/uesio.cognito_pool_id"
		)
		const poolData =
			(await poolIdResponse.json()) as platform.ConfigValueResponse
		const poolId = poolData.value
		const clientIdResponse = await get(
			"/site/configvalues/uesio.cognito_client_id"
		)
		const clientIdData =
			(await clientIdResponse.json()) as platform.ConfigValueResponse
		const clientId = clientIdData.value
		const pool = cognito.getPool(poolId, clientId)
		const authDetails = cognito.getAuthDetails(
			responses.username,
			responses.password
		)
		const cognitoUser = cognito.getUser(responses.username, pool)

		const accessToken = await new Promise((resolve, reject) => {
			cognitoUser.authenticateUser(authDetails, {
				onSuccess: (result) => {
					const accessToken = result.getIdToken().getJwtToken()
					resolve(accessToken)
				},
				onFailure: (err) => {
					const message = err.message || JSON.stringify(err)
					reject(message)
				},
			})
		}).catch((err) => {
			throw new Error("Bad Login: " + err)
		})

		return {
			token: accessToken as string,
		}
	},
} as AuthHandlers

const getCookie = async (): Promise<string | null> => {
	const sessId = await getSessionId()
	return `${SESSION_KEY}=${sessId}`
}

const getSessionIdFromResponse = (response: Response): string => {
	const cookie = response.headers.raw()["set-cookie"][0]
	const sessionPart = cookie.split("; ")[0]
	const sessionArray = sessionPart.split(`${SESSION_KEY}=`)
	return sessionArray[1]
}

const check = async (): Promise<User | null> => {
	const cookie = await getCookie()

	if (!cookie) {
		return null
	}

	const response = await get("site/auth/check", cookie)
	const result = (await response.json()) as AuthCheckResponse
	const user = result.user
	user.cookie = cookie
	if (user && user.profile === "uesio/studio.standard") {
		return user
	}
	return null
}

const login = async (authSource: string): Promise<User> => {
	const handler = authHandlers[authSource]
	if (!handler) {
		throw new Error("That auth type is not yet supported.")
	}
	const authHandlerResponse = await handler()

	const cookie = await getCookie()

	const [namespace, name] = component.path.parseKey(authSource)

	const response = await post(
		`site/auth/${namespace}/${name}/tokenlogin`,
		JSON.stringify(authHandlerResponse),
		cookie
	)

	const sessionId = getSessionIdFromResponse(response)
	await setSessionId(sessionId)

	const result = (await response.json()) as AuthCheckResponse
	const user = result.user
	user.cookie = `${SESSION_KEY}=${sessionId}`

	return user
}

const logout = async (): Promise<void> => {
	const user = await check()
	if (!user) {
		console.log("Not logged in, so can't log out")
		return
	}
	const response = await post("site/auth/logout", "", user.cookie)
	const responseObj = await response.json()
	console.log("logged out", responseObj)
}

const authorize = async (): Promise<User> => {
	// First check to see if we're already logged in.
	const user = await check()
	if (!user) {
		const responses = await inquirer.prompt([
			{
				name: "authtype",
				message: "Select a Login Method",
				type: "list",
				choices: [
					{ name: "Mock Login", value: "uesio/core.mock" },
					{
						name: "Sign in with Email",
						value: "uesio/core.platform",
					},
				],
			},
		])
		return login(responses.authtype)
	}
	return user
}

export { authorize, User, logout }
