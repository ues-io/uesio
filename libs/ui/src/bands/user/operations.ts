import { AnyAction } from "redux"
import { LoginResponse } from "../../auth/auth"
import { Context } from "../../context/context"
import { SignalAPI } from "../../hooks/signalapi"
import { Platform } from "../../platform/platform"
import { StoreAction } from "../../store/actions/actions"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"
import { set as setUser } from "."
import { LoginSignal, LogoutSignal } from "./types"
import { navigateSignal, redirectSignal } from "../route/signals"

async function responseRedirect(
	response: LoginResponse,
	dispatch: Dispatcher<StoreAction>,
	context: Context
): DispatchReturn {
	if ("redirectPath" in response) {
		await SignalAPI.run(
			redirectSignal(response.redirectPath),
			context,
			dispatch
		)
	} else {
		await SignalAPI.run(
			navigateSignal(
				response.redirectRouteName,
				response.redirectRouteNamespace
			),
			// Always run the logout action in the site context.
			new Context(),
			dispatch
		)
	}
	return context
}

const login = (signal: LoginSignal, context: Context): ThunkFunc => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState,
	platform: Platform
): DispatchReturn => {
	const response = await platform.login({
		type: signal.type,
		token: signal.token,
	})
	dispatch(setUser(response.user))
	return responseRedirect(response, dispatch, context)
}

const logout = (signal: LogoutSignal, context: Context): ThunkFunc => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState,
	platform: Platform
): DispatchReturn => {
	const response = await platform.logout()
	dispatch(setUser(response.user))
	return responseRedirect(response, dispatch, context)
}

export default {
	login,
	logout,
}
