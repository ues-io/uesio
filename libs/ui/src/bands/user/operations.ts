import { Context, newContext } from "../../context/context"
import { Dispatcher, ThunkFunc } from "../../store/store"
import { set as setUser } from "."
import wireAddError from "../wire/operations/adderror"
import wireRemoveError from "../wire/operations/removeerror"
import routeOps from "../../bands/route/operations"
import { getErrorString } from "../utils"
import { LoginResponse } from "../../platform/platform"
type Payload = Record<string, string> | undefined
async function responseRedirect(
	response: LoginResponse,
	dispatch: Dispatcher,
	context: Context
) {
	await dispatch(
		"redirectPath" in response
			? routeOps.redirect(context, response.redirectPath)
			: routeOps.navigate(
					// Always run the logout action in the site context.
					newContext({
						site: context.getSite(),
					}),
					{
						path: response.redirectRouteName,
						namespace: response.redirectRouteNamespace,
					}
			  )
	)
	return context
}

const signup =
	(context: Context, signupMethod: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!payload) return context
		const mergedPayload = context.mergeStringMap(payload)
		const mergedSignupMethod = context.mergeString(signupMethod)
		const response = await platform.signup(
			mergedSignupMethod,
			mergedPayload
		)
		dispatch(setUser(response.user))
		return responseRedirect(response, dispatch, context)
	}

const signUpConfirm =
	(context: Context, signupMethod: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!payload)
			throw new Error(
				"No credentials were provided for signup confirmation."
			)
		const mergedPayload = context.mergeStringMap(payload)
		const mergedSignupMethod = context.mergeString(signupMethod)
		try {
			await platform.signUpConfirm(mergedSignupMethod, mergedPayload)
			return context
		} catch (error) {
			const message = getErrorString(error)
			return context.addFrame({ errors: [message] })
		}
	}

const login =
	(context: Context, authSource: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!payload) throw new Error("No credentials were provided for login.")
		const mergedPayload = context.mergeStringMap(payload)
		try {
			const response = await platform.login(authSource, mergedPayload)
			dispatch(setUser(response.user))
			return responseRedirect(response, dispatch, context)
		} catch (error) {
			//CAST the error and decide what error message show to the user, for this operation.
			const message = getErrorString(error)
			return context.addFrame({ errors: [message] })
		}
	}

const logout =
	(context: Context): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const response = await platform.logout()
		dispatch(setUser(response.user))
		return responseRedirect(response, dispatch, context)
	}
const checkAvailability =
	(
		context: Context,
		username: string,
		signupMethod: string,
		usernameFieldId: string
	): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const mergedUsername = context.mergeString(username)
		if (mergedUsername) {
			const mergedSignupMethod = context.mergeString(signupMethod)
			try {
				await platform.checkAvailability(
					mergedSignupMethod,
					mergedUsername
				)
				return dispatch(wireRemoveError(context, usernameFieldId))
			} catch (error) {
				const message = getErrorString(error)
				return dispatch(wireAddError(context, usernameFieldId, message))
			}
		}
		return context
	}

const forgotPassword =
	(context: Context, signupMethod: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
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
			return context.addFrame({ errors: [message] })
		}
	}

const forgotPasswordConfirm =
	(context: Context, signupMethod: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!payload)
			throw new Error(
				"No credentials were provided for forgot password confirmation."
			)
		const mergedPayload = context.mergeStringMap(payload)
		const mergedSignupMethod = context.mergeString(signupMethod)
		try {
			await platform.forgotPasswordConfirm(
				mergedSignupMethod,
				mergedPayload
			)
			return context
		} catch (error) {
			const message = getErrorString(error)
			return context.addFrame({ errors: [message] })
		}
	}

const createLogin =
	(context: Context, signupMethod: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
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
