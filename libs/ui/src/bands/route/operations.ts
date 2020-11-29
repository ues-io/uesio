import { batch } from "react-redux"
import { AnyAction } from "redux"
import { Context } from "../../context/context"
import { SignalAPI } from "../../hooks/signalapi"
import { Platform } from "../../platform/platform"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../../store/store"
import { set as setRoute } from "."
import RuntimeState from "../../store/types/runtimestate"
import { NavigateSignal, RedirectSignal } from "./types"
import { clearAvailableMetadata } from "../builder"

function getWorkspacePrefix(context: Context, signal: NavigateSignal): string {
	const workspace = context.getWorkspace()
	if (workspace && workspace.app && workspace.name) {
		return `/workspace/${workspace.app}/${workspace.name}/app/${signal.namespace}/`
	}
	return "/"
}

const redirect = (
	signal: RedirectSignal,
	context: Context
): ThunkFunc => async (): DispatchReturn => {
	const mergedPath = context.merge(signal.path)
	window.location.href = mergedPath
	return context
}

const navigate = (
	signal: NavigateSignal,
	context: Context
): ThunkFunc => async (
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
		dispatch(clearAvailableMetadata())
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

export default {
	redirect,
	navigate,
}
