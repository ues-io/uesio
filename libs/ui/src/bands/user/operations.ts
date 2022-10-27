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
		const mergedPayload = context.mergeMap(payload)
		const response = await platform.signup(signupMethod, mergedPayload)
		dispatch(setUser(response.user))
		return responseRedirect(response, dispatch, context)
	}

const login =
	(context: Context, authSource: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!payload) throw new Error("No credentials were provided for login.")
		const mergedPayload = context.mergeMap(payload)
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
		const mergedUsername = context.merge(username)
		if (mergedUsername) {
			try {
				await platform.checkAvailability(signupMethod, mergedUsername)
				return dispatch(wireRemoveError(context, usernameFieldId))
			} catch (error) {
				const message = getErrorString(error)
				return dispatch(wireAddError(context, usernameFieldId, message))
			}
		}
		return context
	}

const forgotPassword =
	(context: Context, authSource: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!payload)
			throw new Error("No credentials were provided for forgot password.")
		const mergedPayload = context.mergeMap(payload)
		const mergedAuthSource = context.merge(authSource)
		try {
			await platform.forgotPassword(mergedAuthSource, mergedPayload)
			return context
		} catch (error) {
			const message = getErrorString(error)
			return context.addFrame({ errors: [message] })
		}
	}

const forgotPasswordConfirm =
	(context: Context, authSource: string, payload: Payload): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!payload)
			throw new Error(
				"No credentials were provided for forgot password confirmation."
			)
		const mergedPayload = context.mergeMap(payload)
		try {
			await platform.forgotPasswordConfirm(authSource, mergedPayload)
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
		const mergedPayload = context.mergeMap(payload)
		const mergedSignupMethod = context.merge(signupMethod)
		const response = await platform.createLogin(
			context,
			mergedSignupMethod,
			mergedPayload
		)
		//TO-DO
		//dispatch(setUser(response.user))
		return responseRedirect(response, dispatch, context)
	}

export default {
	login,
	logout,
	signup,
	checkAvailability,
	forgotPassword,
	forgotPasswordConfirm,
	createLogin,
}
