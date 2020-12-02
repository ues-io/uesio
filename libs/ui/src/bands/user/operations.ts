import { AnyAction } from "redux"
import { LoginResponse } from "../../auth/auth"
import { Context } from "../../context/context"
import { Platform } from "../../platform/platform"
import { Dispatcher } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"
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
					new Context(),
					response.redirectRouteName,
					response.redirectRouteNamespace
			  )
	)
	return context
}

const login = (context: Context, type: string, token: string) => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState,
	platform: Platform
) => {
	const response = await platform.login({
		type,
		token,
	})
	dispatch(setUser(response.user))
	return responseRedirect(response, dispatch, context)
}

const logout = (context: Context) => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState,
	platform: Platform
) => {
	const response = await platform.logout()
	dispatch(setUser(response.user))
	return responseRedirect(response, dispatch, context)
}

export default {
	login,
	logout,
}
