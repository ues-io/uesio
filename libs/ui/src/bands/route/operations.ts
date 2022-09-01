import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setRoute, setLoading } from "."
import { NavigateRequest } from "../../platform/platform"
import { batch } from "react-redux"
import { loadScripts } from "../../hooks/usescripts"
import { dispatchRouteDeps, getPackUrlsForDeps } from "./utils"

const redirect = (context: Context, path: string, newTab?: boolean) => () => {
	const mergedPath = context.merge(path)
	if (newTab) {
		window.open(mergedPath, "_blank")
		return context
	}
	window.location.href = mergedPath
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
		request: NavigateRequest,
		noPushState?: boolean
	): ThunkFunc =>
	async (dispatch, getState, platform) => {
		dispatch(setLoading())

		const workspace = context.getWorkspace()

		const routeResponse = await platform.getRoute(context, request)

		if (!routeResponse) return context

		const deps = routeResponse.dependencies

		if (!noPushState) {
			const prefix = getRouteUrlPrefix(context, routeResponse.namespace)
			window.history.pushState(
				{
					namespace: routeResponse.namespace,
					path: routeResponse.path,
					workspace,
				},
				"",
				prefix + routeResponse.path
			)
		}

		const newPacks = getPackUrlsForDeps(deps, context)

		if (newPacks && newPacks.length) {
			await loadScripts(newPacks)
		}

		// We don't need to store the dependencies in redux
		delete routeResponse.dependencies

		batch(() => {
			dispatchRouteDeps(deps, dispatch)
			dispatch(setRoute(routeResponse))
		})

		return context
	}

export default {
	redirect,
	navigate,
}
