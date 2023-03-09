import { Context } from "../../context/context"
import { set as setRoute, setLoading } from "."
import { NavigateRequest, platform } from "../../platform/platform"
import { batch } from "react-redux"
import { loadScripts } from "../../hooks/usescripts"
import { dispatchRouteDeps, getPackUrlsForDeps } from "./utils"
import { dispatch } from "../../store/store"

const redirect = (context: Context, path: string, newTab?: boolean) => {
	const mergedPath = context.mergeString(path)
	if (newTab) {
		window.open(mergedPath, "_blank")
		return context
	}
	window.location.href = mergedPath
	return context
}

const getRouteUrlPrefix = (context: Context, namespace: string | undefined) => {
	const workspace = context.getWorkspace()
	if (workspace && workspace.app && workspace.name) {
		if (!namespace) namespace = workspace.app
		return `/workspace/${workspace.app}/${workspace.name}/app/${namespace}/`
	}

	const site = context.getSite()
	if (site && site.app) {
		if (!namespace) namespace = site.app
		if (site.app !== namespace) {
			return `/site/app/${namespace}/`
		}
	}
	return "/"
}

const navigate = async (
	context: Context,
	request: NavigateRequest,
	noPushState?: boolean
) => {
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
				title: routeResponse.title,
				workspace,
			},
			"",
			prefix + routeResponse.path
		)
		// Route title and tags should be pre-merged by the server, so we just need to go synchronize them
		document.title = routeResponse.title || "Uesio"
		if (routeResponse.tags?.length) {
			routeResponse.tags.forEach((tag) => {
				if (tag.location === "head" && tag.type === "meta") {
					let metaTag = document.head.querySelector(`meta[name=${tag.name}]`)
					if (!metaTag) {
						metaTag = document.createElement("meta");
						document.getElementsByTagName("head")[0].appendChild(metaTag);
					}
					metaTag.setAttribute("content", tag.content)
				}
			})
		}
	}

	const newPacks = getPackUrlsForDeps(deps, context)

	if (newPacks && newPacks.length) {
		await loadScripts(newPacks)
	}

	// We don't need to store the dependencies in redux
	delete routeResponse.dependencies

	batch(() => {
		dispatchRouteDeps(deps)
		dispatch(setRoute(routeResponse))
	})

	return context
}

export { getRouteUrlPrefix, redirect, navigate }
