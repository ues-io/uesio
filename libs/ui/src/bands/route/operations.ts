import { batch } from "react-redux"
import { AnyAction } from "redux"
import { Context } from "../../context/context"
import { Platform } from "../../platform/platform"
import { Dispatcher } from "../../store/store"
import { set as setRoute } from "."
import RuntimeState from "../../store/types/runtimestate"
import { clearAvailableMetadata } from "../builder"
import loadViewOp from "../view/operations/load"

const redirect = (context: Context, path: string) => async () => {
	const mergedPath = context.merge(path)
	window.location.href = mergedPath
	return context
}

const navigate = (
	context: Context,
	path: string,
	namespace: string,
	noPushState?: boolean
) => async (
	dispatch: Dispatcher<AnyAction>,
	getState: () => RuntimeState,
	platform: Platform
) => {
	const mergedPath = context.merge(path)
	const routeResponse = await platform.getRoute(
		context,
		namespace,
		mergedPath
	)
	const viewName = routeResponse.viewname
	const viewNamespace = routeResponse.viewnamespace

	// Pre-load the view for faster appearances and no white flash
	await dispatch(
		loadViewOp({
			context: context.addFrame({
				view: `${viewNamespace}.${viewName}()`,
				viewDef: `${viewNamespace}.${viewName}`,
			}),
			namespace: viewNamespace,
			name: viewName,
			path: "",
			params: routeResponse.params,
		})
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
	if (!noPushState) {
		const workspace = context.getWorkspace()
		const prefix =
			workspace && workspace.app && workspace.name
				? `/workspace/${workspace.app}/${workspace.name}/app/${namespace}/`
				: "/"
		window.history.pushState(
			{
				namespace: namespace,
				path: mergedPath,
				workspace,
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
