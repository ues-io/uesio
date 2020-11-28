import RuntimeState from "../store/types/runtimestate"
import PlatformActor from "./platformactor"
import {
	LOGIN,
	LOGOUT,
	LoginSignal,
	NAVIGATE,
	NavigateSignal,
	LogoutSignal,
	RedirectSignal,
	REDIRECT,
} from "./platformbandsignals"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../store/store"
import { Platform } from "./platform"
import { SignalAPI } from "../hooks/signalapi"
import {
	BandAction,
	ActionGroup,
	StoreAction,
	BAND,
} from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { LoginResponse } from "../auth/auth"
import { Context } from "../context/context"
import { batch } from "react-redux"
import { LoginAction, LogoutAction } from "./platformbandactions"
import { BUILDER_BAND } from "../builder/builderband"
import { CLEAR_AVAILABLE_METADATA } from "../builder/builderbandactions"
import { set as setRoute } from "../bands/route"
import { AnyAction } from "redux"

async function responseRedirect(
	response: LoginResponse,
	dispatch: Dispatcher<StoreAction>,
	context: Context
): DispatchReturn {
	if ("redirectPath" in response) {
		await SignalAPI.run(
			{
				band: "platform",
				signal: REDIRECT,
				path: response.redirectPath,
			},
			context,
			dispatch
		)
	} else {
		await SignalAPI.run(
			{
				band: "platform",
				signal: NAVIGATE,
				path: response.redirectRouteName,
				namespace: response.redirectRouteNamespace,
			},
			// Always run the logout action in the site context.
			new Context(),
			dispatch
		)
	}
	return context
}

function getWorkspacePrefix(context: Context, signal: NavigateSignal): string {
	const workspace = context.getWorkspace()
	if (workspace && workspace.app && workspace.name) {
		return `/workspace/${workspace.app}/${workspace.name}/app/${signal.namespace}/`
	}
	return "/"
}

class PlatformBand {
	static actionGroup: ActionGroup = {
		[LOGIN]: (action: LoginAction, state: RuntimeState): RuntimeState => {
			return {
				...state,
				user: action.data,
			}
		},
		[LOGOUT]: (action: LogoutAction, state: RuntimeState): RuntimeState => {
			return {
				...state,
				user: action.data,
			}
		},
	}

	static signalHandlers: SignalsHandler = {
		[LOGIN]: {
			dispatcher: (signal: LoginSignal, context: Context): ThunkFunc => {
				return async (
					dispatch: Dispatcher<LoginAction>,
					getState: () => RuntimeState,
					platform: Platform
				): DispatchReturn => {
					const response = await platform.login({
						type: signal.data.type,
						token: signal.data.token,
					})
					dispatch({
						type: BAND,
						band: signal.band,
						name: signal.signal,
						data: response.user,
					})
					return responseRedirect(response, dispatch, context)
				}
			},
		},
		[LOGOUT]: {
			dispatcher: (signal: LogoutSignal, context: Context): ThunkFunc => {
				return async (
					dispatch: Dispatcher<LogoutAction>,
					getState: () => RuntimeState,
					platform: Platform
				): DispatchReturn => {
					const response = await platform.logout()
					// When you dispatch an action, it's sync
					dispatch({
						type: BAND,
						band: signal.band,
						name: signal.signal,
						data: response.user,
					})
					return responseRedirect(response, dispatch, context)
				}
			},
		},
		[REDIRECT]: {
			dispatcher: (
				signal: RedirectSignal,
				context: Context
			): ThunkFunc => {
				return async (): DispatchReturn => {
					const mergedPath = context.merge(signal.path)
					window.location.href = mergedPath
					return context
				}
			},
		},
		[NAVIGATE]: {
			dispatcher: (
				signal: NavigateSignal,
				context: Context
			): ThunkFunc => {
				return async (
					dispatch: Dispatcher<AnyAction>,
					getState: () => RuntimeState,
					platform: Platform
				): DispatchReturn => {
					const mergedPath = context.merge(signal.path)
					const routeResponse = await platform.getRoute(
						context,
						signal.namespace,
						mergedPath
					)
					const viewName = routeResponse.viewname
					const viewNamespace = routeResponse.viewnamespace

					// Pre-load the view for faster appearances and no white flash
					await SignalAPI.run(
						{
							band: "view",
							signal: "LOAD",
							namespace: viewNamespace,
							name: viewName,
							path: "",
							params: routeResponse.params,
						},
						context,
						dispatch
					)

					batch(() => {
						dispatch({
							type: BAND,
							band: BUILDER_BAND,
							name: CLEAR_AVAILABLE_METADATA,
						})
						dispatch(
							setRoute({
								name: viewName,
								namespace: viewNamespace,
								params: routeResponse.params,
								workspace: routeResponse.workspace,
							})
						)
					})
					if (!signal.noPushState) {
						const prefix = getWorkspacePrefix(context, signal)
						window.history.pushState(
							{
								namespace: signal.namespace,
								path: mergedPath,
								workspace: context.getWorkspace(),
							},
							"",
							prefix + mergedPath
						)
					}
					return context
				}
			},
		},
	}

	static receiveAction(
		action: BandAction,
		state: RuntimeState
	): RuntimeState {
		const handler = this.actionGroup[action.name]
		return handler
			? Object.assign({}, state, handler(action, state, state))
			: state
	}

	static receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc {
		const handler = this.signalHandlers[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	static getActor(): PlatformActor {
		return new PlatformActor()
	}

	static getSignalProps(/*signal: SignalDefinition*/): PropDescriptor[] {
		return []
	}
}

export { PlatformBand }
