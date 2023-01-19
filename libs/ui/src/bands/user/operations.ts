import { Context, newContext } from "../../context/context"
import { dispatch } from "../../store/store"
import { set as setUser } from "."
import wireAddError from "../wire/operations/adderror"
import wireRemoveError from "../wire/operations/removeerror"
import routeOps from "../../bands/route/operations"
import { getErrorString } from "../utils"
import { LoginResponse, platform } from "../../platform/platform"
type Payload = Record<string, string> | undefined
async function responseRedirect(response: LoginResponse, context: Context) {
	return "redirectPath" in response
		? routeOps.redirect(context, response.redirectPath)
		: routeOps.navigate(
				// Always run the logout action in the site context.
				newContext().addRouteFrame({
					site: context.getSite(),
				}),
				{
					path: response.redirectRouteName,
					namespace: response.redirectRouteNamespace,
				}
		  )
}

const signup = async (
	context: Context,
	signupMethod: string,
	payload: Payload
) => {
	if (!payload) return context
	const mergedPayload = context.mergeStringMap(payload)
	const mergedSignupMethod = context.mergeString(signupMethod)
	const response = await platform.signup(mergedSignupMethod, mergedPayload)
	dispatch(setUser(response.user))
	return responseRedirect(response, context)
}

const signUpConfirm = async (
	context: Context,
	signupMethod: string,
	payload: Payload
) => {
	if (!payload)
		throw new Error("No credentials were provided for signup confirmation.")
	const mergedPayload = context.mergeStringMap(payload)
	const mergedSignupMethod = context.mergeString(signupMethod)
	try {
		await platform.signUpConfirm(mergedSignupMethod, mergedPayload)
		return context
	} catch (error) {
		const message = getErrorString(error)
		return context.addErrorFrame([message])
	}
}

const login = async (
	context: Context,
	authSource: string,
	payload: Payload
) => {
	if (!payload) throw new Error("No credentials were provided for login.")
	const mergedPayload = context.mergeStringMap(payload)
	try {
		const response = await platform.login(authSource, mergedPayload)
		dispatch(setUser(response.user))
		return responseRedirect(response, context)
	} catch (error) {
		//CAST the error and decide what error message show to the user, for this operation.
		const message = getErrorString(error)
		return context.addErrorFrame([message])
	}
}

const logout = async (context: Context) => {
	const response = await platform.logout()
	dispatch(setUser(response.user))
	return responseRedirect(response, context)
}

const checkAvailability = async (
	context: Context,
	username: string,
	signupMethod: string,
	usernameFieldId: string
) => {
	const mergedUsername = context.mergeString(username)
	if (mergedUsername) {
		const mergedSignupMethod = context.mergeString(signupMethod)
		try {
			await platform.checkAvailability(mergedSignupMethod, mergedUsername)
			wireRemoveError(context, usernameFieldId)
			return context
		} catch (error) {
			const message = getErrorString(error)
			wireAddError(context, usernameFieldId, message)
			return context
		}
	}
	return context
}

const forgotPassword = async (
	context: Context,
	signupMethod: string,
	payload: Payload
) => {
	if (!payload)
		throw new Error("No credentials were provided for forgot password.")
	const mergedPayload = context.mergeStringMap(payload)
	const mergedSignupMethod = context.mergeString(signupMethod)
	try {
		await platform.forgotPassword(
			context,
			mergedSignupMethod,
			mergedPayload
		)
		return context
	} catch (error) {
		const message = getErrorString(error)
		return context.addErrorFrame([message])
	}
}

const forgotPasswordConfirm = async (
	context: Context,
	signupMethod: string,
	payload: Payload
) => {
	if (!payload)
		throw new Error(
			"No credentials were provided for forgot password confirmation."
		)
	const mergedPayload = context.mergeStringMap(payload)
	const mergedSignupMethod = context.mergeString(signupMethod)
	try {
		await platform.forgotPasswordConfirm(mergedSignupMethod, mergedPayload)
		return context
	} catch (error) {
		const message = getErrorString(error)
		return context.addErrorFrame([message])
	}
}

const createLogin = async (
	context: Context,
	signupMethod: string,
	payload: Payload
) => {
	if (!payload) return context
	const mergedPayload = context.mergeStringMap(payload)
	const mergedSignupMethod = context.mergeString(signupMethod)
	await platform.createLogin(context, mergedSignupMethod, mergedPayload)
	return context
}

export default {
	login,
	logout,
	signup,
	signUpConfirm,
	checkAvailability,
	forgotPassword,
	forgotPasswordConfirm,
	createLogin,
}
