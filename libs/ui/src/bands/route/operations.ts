import { Context } from "../../context/context"
import { set as setRoute, setLoading } from "."
import {
	PathNavigateRequest,
	AssignmentNavigateRequest,
	platform,
	RouteNavigateRequest,
} from "../../platform/platform"
import { loadScripts } from "../../hooks/usescripts"
import { dispatchRouteDeps } from "./utils"
import { dispatch } from "../../store/store"
import { RouteState } from "./types"
import { nanoid } from "@reduxjs/toolkit"

// Check if we are in a real browser (vs in JSDom)
const isRealBrowser = Object.getOwnPropertyDescriptor(self, "window")
	?.get?.toString()
	.includes("[native code]")

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

const isRedirect = (routeResponse: RouteState) =>
	routeResponse.type === "redirect"

const navigateToAssignment = async (
	context: Context,
	request: AssignmentNavigateRequest
) => {
	dispatch(setLoading())
	const routeResponse = await platform.getRouteAssignment(context, request)
	const prefix = getRouteUrlPrefix(context, routeResponse.namespace)
	const isRedirectRoute = isRedirect(routeResponse)
	if (request.newtab || isRedirectRoute) {
		const usePath =
			isRedirectRoute && routeResponse.redirect
				? routeResponse.redirect
				: prefix + routeResponse.path
		redirect(context, usePath, true)
		return context
	}
	pushRouteState(context, routeResponse, prefix + routeResponse.path)
	return handleNavigateResponse(context, routeResponse)
}

const navigateToRoute = async (
	context: Context,
	request: RouteNavigateRequest
) => {
	dispatch(setLoading())
	const routeResponse = await platform.getRouteByKey(context, request)
	const prefix = getRouteUrlPrefix(context, routeResponse.namespace)
	const isRedirectRoute = isRedirect(routeResponse)
	if (request.newtab || isRedirectRoute) {
		const usePath =
			isRedirectRoute && routeResponse.redirect
				? routeResponse.redirect
				: prefix + routeResponse.path
		redirect(context, usePath, true)
		return context
	}
	pushRouteState(context, routeResponse, prefix + routeResponse.path)
	return handleNavigateResponse(context, routeResponse)
}

const navigate = async (
	context: Context,
	request: PathNavigateRequest,
	noPushState?: boolean
) => {
	dispatch(setLoading())
	const routeResponse = await platform.getRoute(context, request)

	if (!noPushState) {
		const params = request.path.includes("?")
			? "?" + context.mergeString(request.path.split("?")[1])
			: ""
		const prefix = getRouteUrlPrefix(context, routeResponse.namespace)
		pushRouteState(
			context,
			routeResponse,
			prefix + routeResponse.path + params
		)
	}

	return handleNavigateResponse(context, routeResponse)
}

const pushRouteState = (context: Context, route: RouteState, url?: string) => {
	if (!route) return
	const { namespace, path, title, tags, params } = route
	window.history.pushState(
		{
			namespace,
			path,
			title,
			tags,
			params,
			workspace: context.getWorkspace(),
		},
		"",
		url
	)
}

const handleNavigateResponse = async (
	context: Context,
	routeResponse: RouteState | undefined
) => {
	if (!routeResponse) return context
	const deps = routeResponse.dependencies

	routeResponse.batchid = nanoid()

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

	const packDeps = deps?.componentpack

	if (packDeps) {
		await loadScripts(packDeps, context)
	}

	// We don't need to store the dependencies in redux with the route itself
	delete routeResponse.dependencies

	dispatch(setRoute(routeResponse))
	dispatchRouteDeps(deps)

	// Always scroll to top of view after doing a route navigate
	if (isRealBrowser) {
		window.scrollTo(0, 0)
	}

	return context
}

export {
	getRouteUrlPrefix,
	redirect,
	navigate,
	navigateToAssignment,
	navigateToRoute,
	handleNavigateResponse,
}
