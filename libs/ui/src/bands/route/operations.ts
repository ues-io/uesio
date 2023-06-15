import { Context } from "../../context/context"
import { set as setRoute, setLoading } from "."
import {
	PathNavigateRequest,
	AssignmentNavigateRequest,
	platform,
} from "../../platform/platform"
import { batch } from "react-redux"
import { loadScripts } from "../../hooks/usescripts"
import { dispatchRouteDeps, getPackUrlsForDeps } from "./utils"
import { dispatch } from "../../store/store"
import { RouteState } from "./types"

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

const navigateToAssignment = async (
	context: Context,
	request: AssignmentNavigateRequest
) => {
	dispatch(setLoading())
	const routeResponse = await platform.getRouteAssignment(context, request)
	return handleNavigateResponse(context, routeResponse)
}

const navigate = async (
	context: Context,
	request: PathNavigateRequest,
	noPushState?: boolean
) => {
	dispatch(setLoading())
	const routeResponse = await platform.getRoute(context, request)
	return handleNavigateResponse(context, routeResponse, noPushState)
}

const handleNavigateResponse = async (
	context: Context,
	routeResponse: RouteState,
	noPushState?: boolean
) => {
	if (!routeResponse) return context
	const deps = routeResponse.dependencies

	const workspace = context.getWorkspace()

	if (!noPushState) {
		const prefix = getRouteUrlPrefix(context, routeResponse.namespace)
		window.history.pushState(
			{
				namespace: routeResponse.namespace,
				path: routeResponse.path,
				title: routeResponse.title,
				tags: routeResponse.tags,
				workspace,
			},
			"",
			prefix + routeResponse.path
		)
	}

	// Route title and tags should be pre-merged by the server, so we just need to go synchronize them
	document.title = routeResponse.title || "Uesio"
	// Remove any existing route-injected tags
	document
		.querySelectorAll("meta[data-uesio], link[data-uesio]")
		.forEach((elem) => elem.remove())
	// Add any head tags defined by the route
	if (routeResponse.tags?.length) {
		const headEl = document.getElementsByTagName("head")[0]
		routeResponse.tags.forEach(({ content, location, name, type }) => {
			if (location === "head") {
				let newEl
				if (type === "meta") {
					newEl = document.createElement("meta")
					newEl.setAttribute("name", name)
					newEl.setAttribute("content", content)
				} else if (type === "link") {
					newEl = document.createElement("link")
					newEl.setAttribute("rel", name)
					newEl.setAttribute("href", content)
				}
				if (newEl) {
					newEl.setAttribute("data-uesio", "true")
					headEl.appendChild(newEl)
				}
			}
		})
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

	// Always scroll to top of view after doing a route navigate
	window.scrollTo(0, 0)

	return context
}

export { getRouteUrlPrefix, redirect, navigate, navigateToAssignment }
