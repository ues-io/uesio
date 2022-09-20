import { Response } from "node-fetch"
import { get, post } from "../request/request"
import { getSessionId, setSessionId } from "../config/config"
import inquirer from "inquirer"
import { component } from "#uesio/ui"

type AuthHandlerResponse = Record<string, string>

type AuthHandler = () => Promise<AuthHandlerResponse>

type AuthCheckResponse = {
	user: User
}

type User = {
	username: string
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
		token: JSON.stringify({
			authType: "mock",
			subject: "ben",
		}),
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

		return {
			username: responses.username as string,
			password: responses.password as string,
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
		`site/auth/${namespace}/${name}/login`,
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
						name: "Sign in with Username",
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
