import { Response } from "node-fetch"
import { get, post } from "../request/request"
import { getSessionId, setSessionId } from "../config/config"
import inquirer = require("inquirer")

const MOCK_LOGIN = "mock"
const GOOGLE_LOGIN = "google"

type AuthHandlerResponse = {
	type: string
	token: string
}

type AuthHandler = () => Promise<AuthHandlerResponse>

type User = {
	firstname: string
	lastname: string
	profile: string
	site: string
	cookie: string
}

type AuthHandlers = {
	[key: string]: AuthHandler
}

const SESSION_KEY = "sessid"

const authHandlers = {
	[MOCK_LOGIN]: async (): Promise<AuthHandlerResponse> => {
		return await Promise.resolve({
			type: "mock",
			token: "mocktoken",
		})
	},
	[GOOGLE_LOGIN]: (): never => {
		throw new Error("Google Auth is not yet supported.")
	},
} as AuthHandlers

const getCookie = async (): Promise<ReturnType<getSessionId>> => {
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
	const result = await response.json()
	const user = result.user as User
	user.cookie = cookie
	if (user && user.profile === "uesio.standard" && user.site === "studio") {
		return user
	}
	return null
}

const login = async (authType: string): Promise<User> | never => {
	const handler = authHandlers[authType]
	if (!handler) {
		throw new Error("That auth type is not yet supported.")
	}
	const authHandlerResponse = await handler()

	const response = await post(
		"site/auth/login",
		JSON.stringify(authHandlerResponse)
	)

	const sessionId = getSessionIdFromResponse(response)
	await setSessionId(sessionId)

	const result = await response.json()
	const user = result.user
	user.cookie = `${SESSION_KEY}=${sessionId}`

	return user
}

const logout = async (): Promise<void | ReturnType<typeof post>> => {
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
					{ name: "Sign in with Google", value: GOOGLE_LOGIN },
					{ name: "Mock Login", value: MOCK_LOGIN },
				],
			},
		])
		return login(responses.authtype)
	}
	return user
}

export { authorize, User, logout }
