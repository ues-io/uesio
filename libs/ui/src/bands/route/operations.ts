import { batch } from "react-redux"
import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setRoute } from "."
import { clearAvailableMetadata } from "../builder"
import loadViewOp from "../view/operations/load"

const redirect = (context: Context, path: string) => async () => {
	window.location.href = context.merge(path)
	return context
}

const navigate = (
	context: Context,
	path: string,
	namespace: string,
	noPushState?: boolean
): ThunkFunc => async (dispatch, getState, platform) => {
	const mergedPath = context.merge(path)
	const routeResponse = await platform.getRoute(
		context,
		namespace,
		mergedPath
	)
	const view = routeResponse.view

	// Pre-load the view for faster appearances and no white flash
	await dispatch(
		loadViewOp({
			context: new Context([
				{
					view: `${view}()`,
					viewDef: view,
					workspace: context.getWorkspace(),
				},
			]),
			path: "",
			params: routeResponse.params,
		})
	)

	batch(() => {
		dispatch(clearAvailableMetadata())
		dispatch(
			setRoute({
				view,
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
				namespace,
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
