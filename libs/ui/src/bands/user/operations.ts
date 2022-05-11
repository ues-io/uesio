import { AnyAction } from "redux"
import { LoginResponse } from "../../auth/auth"
import { Context } from "../../context/context"
import { Dispatcher, ThunkFunc } from "../../store/store"
import { set as setUser } from "."
import addError from "../wire/operations/adderror"
import removeError from "../wire/operations/removeerror"
import routeOps from "../../bands/route/operations"
type Payload = Record<string, string> | undefined
async function responseRedirect(
	response: LoginResponse,
	dispatch: Dispatcher<AnyAction>,
	context: Context
) {
	await dispatch(
		"redirectPath" in response
			? routeOps.redirect(context, response.redirectPath)
			: routeOps.navigate(
					// Always run the logout action in the site context.
					new Context([
						{
							site: context.getSite(),
						},
					]),
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
		if (!payload) return context
		const mergedPayload = context.mergeMap(payload)
		const response = await platform.login(authSource, mergedPayload)
		dispatch(setUser(response.user))
		return responseRedirect(response, dispatch, context)
	}

const logout =
	(context: Context): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const response = await platform.logout()
		dispatch(setUser(response.user))
		return responseRedirect(response, dispatch, context)
	}
const testUsername =
	(context: Context, username: string, usernameFieldId: string): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const response = await platform.testUsername(username)
		if (response === false)
			return dispatch(
				addError(
					context,
					usernameFieldId,
					"Username not available, try something more creative"
				)
			)
		// remove error if api call fails or username is available
		if (response === true || !response)
			return dispatch(removeError(context, usernameFieldId))
		return context
	}

export default {
	login,
	logout,
	signup,
	testUsername,
}
