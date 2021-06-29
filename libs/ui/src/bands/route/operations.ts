import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setRoute, setLoading } from "."
import loadViewOp from "../view/operations/load"

const redirect = (context: Context, path: string) => () => {
	window.location.href = context.merge(path)
	return context
}

const getRouteUrlPrefix = (context: Context, namespace: string) => {
	const workspace = context.getWorkspace()
	if (workspace && workspace.app && workspace.name) {
		return `/workspace/${workspace.app}/${workspace.name}/app/${namespace}/`
	}
	const site = context.getSite()
	if (site && site.app && site.app !== namespace) {
		return `/site/app/${namespace}/`
	}
	return "/"
}

const navigate =
	(
		context: Context,
		path: string,
		namespace: string,
		noPushState?: boolean
	): ThunkFunc =>
	async (dispatch, getState, platform) => {
		if (!namespace) {
			// This is the namespace of the viewdef in context. We can assume if a namespace isn't
			// provided, they want to navigate within the same namespace.
			const viewDef = context.getViewDef()
			namespace = viewDef?.namespace || ""
		}

		dispatch(setLoading())

		const workspace = context.getWorkspace()
		const mergedPath = context.merge(path)
		const routeResponse = await platform.getRoute(
			context,
			namespace,
			mergedPath
		)

		if (!routeResponse) return context
		const view = routeResponse.view

		// Pre-load the view for faster appearances and no white flash
		await dispatch(
			loadViewOp({
				context: new Context([
					{
						view: `${view}()`,
						viewDef: view,
						workspace,
					},
				]),
				path: "",
				params: routeResponse.params,
			})
		)

		dispatch(setRoute(routeResponse))

		if (!noPushState) {
			const prefix = getRouteUrlPrefix(context, namespace)
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
