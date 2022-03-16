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

const login =
	(context: Context, type: string, token: string): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const response = await platform.login({
			type,
			token,
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

const signUp =
	(context: Context): ThunkFunc =>
	async (dispatch, getState, platform) => {
		const wire = context.getWire()
		if (!wire) return
		const key = Object.keys(wire.source.data)[0]
		const namespacedData = wire.source.data[key]
		if (!namespacedData) return
		const data = Object.keys(namespacedData).reduce((acc, v) => {
			const newKey = v.replace("uesio.", "")
			return { ...acc, [newKey]: namespacedData[v] }
		}, {})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = (await platform.signUp(data)) as any

		return response
	}

export default {
	login,
	logout,
	signUp,
}
