import { AnyAction } from "redux"
import { LoginResponse } from "../../auth/auth"
import { Context } from "../../context/context"
import { Dispatcher, ThunkFunc } from "../../store/store"
import { set as setUser } from "."
import routeOps from "../../bands/route/operations"

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

const loginToken =
	(context: Context, authSource: string, token: string): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const response = await platform.loginToken(authSource, {
			token,
		})
		dispatch(setUser(response.user))
		return responseRedirect(response, dispatch, context)
	}

const login =
	(
		context: Context,
		authSource: string,
		username: string,
		password: string
	): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const response = await platform.login(authSource, {
			username,
			password,
		})
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

export default {
	loginToken,
	login,
	logout,
}
