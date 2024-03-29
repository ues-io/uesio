import { Context } from "../../context/context"
import { dispatch } from "../../store/store"
import { set as setUser } from "."
import { navigate, redirect } from "../../bands/route/operations"
import { getErrorString } from "../utils"
import { LoginResponse, platform } from "../../platform/platform"
type Payload = Record<string, string> | undefined
async function responseRedirect(response: LoginResponse, context: Context) {
	return "redirectPath" in response
		? redirect(context, response.redirectPath)
		: navigate(
				// Always run the logout action in the base route context.
				context.getRouteContext(),
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
	const response = await platform.signup(
		context,
		mergedSignupMethod,
		mergedPayload
	)
	dispatch(setUser(response.user))
	return responseRedirect(response, context)
}

const login = async (
	context: Context,
	authSource: string,
	payload: Payload
) => {
	if (!payload) throw new Error("No credentials were provided for login.")
	const mergedPayload = context.mergeStringMap(payload)
	try {
		const response = await platform.login(
			context,
			authSource,
			mergedPayload
		)
		dispatch(setUser(response.user))
		return responseRedirect(response, context)
	} catch (error) {
		//CAST the error and decide what error message show to the user, for this operation.
		const message = getErrorString(error)
		return context.addErrorFrame([message])
	}
}

const logout = async (context: Context) => {
	const response = await platform.logout(context)
	dispatch(setUser(response.user))
	return responseRedirect(response, context)
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
		await platform.forgotPasswordConfirm(
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
	forgotPassword,
	forgotPasswordConfirm,
	createLogin,
}
