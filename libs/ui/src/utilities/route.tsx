import { useEffect } from "react"
import { useRoute } from "../bands/route/selectors"
import Progress from "./progress"
import { ViewArea } from "../components/view"
import { useSite } from "../bands/site"
import { Context } from "../context/context"
import {
	getRouteUrlPrefix,
	navigate,
	redirect,
} from "../bands/route/operations"
import NotificationArea from "./notificationarea"
import { Component } from "../component/component"
import { makeViewId } from "../bands/view"
import { UtilityComponent } from "../definition/definition"
import { Preset, defineConfig, setup } from "@twind/core"
import presetAutoprefix from "@twind/preset-autoprefix"
import presetTailwind from "@twind/preset-tailwind"
import { styles } from ".."
import FontFaceObserver from "fontfaceobserver"

new FontFaceObserver("Material Icons").load(null, 20000).then(() => {
	document.documentElement.classList.remove("noicons")
})

// This is a hack to get webfonts (specifically Gosha) to show up in safari
// after they've been loaded. I've tried a bunch of different things,
// including different font-display: swap,block,optional,etc to no avail.
// All this code does is cause the browser to repaint after Gosha has been loaded.
const gosha = new FontFaceObserver("Gosha")
const roboto = new FontFaceObserver("Roboto")
Promise.all([gosha.load(null, 20000), roboto.load(null, 20000)]).then(() => {
	const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
	if (!isSafari) return
	document.documentElement.style.display = "none"
	document.documentElement.offsetHeight
	document.documentElement.style.display = ""
})

// This converts all our @media queries to @container queries
const presetContainerQueries = () =>
	({
		finalize: (rule) => {
			if (rule.r && rule.r.length > 0 && rule.r[0].startsWith("@media")) {
				rule.r[0] = rule.r[0].replace("@media", "@container")
			}
			return rule
		},
	}) as Preset

const Route: UtilityComponent = (props) => {
	const site = useSite()
	const route = useRoute()

	useEffect(() => {
		if (!route) return
		const { namespace, path, workspace, params } = route
		// This makes sure that the namespace and path of the route is specified in the history.
		window.history.replaceState(
			{
				namespace,
				path,
				workspace,
				params,
			},
			"",
			route.path
				? getRouteUrlPrefix(routeContext, namespace) +
						route.path +
						window.location.search
				: undefined
		)
		// We only want this hook to fire once (when this route component was first mounted)
		// If it fires when the route changes, then we're just overwriting the changes we made
		// in the navigate operation (with pushState)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		window.onpopstate = (event: PopStateEvent) => {
			const { workspace, namespace, title, tags, params } = event.state
			let { path } = event.state

			if (!path || !namespace) {
				// In some cases, our path and namespace aren't available in the history state.
				// If that is the case, then just punt and do a plain redirect.
				redirect(new Context(), document.location.pathname)
				return
			}

			let navigateContext = new Context()
			if (workspace)
				navigateContext = navigateContext.setWorkspace(workspace)
			if (site) navigateContext = navigateContext.setSite(site)

			// If there are params in the route, then we need to add them to our path,
			// as long as our path doesn't already have a ? in it.
			if (params && path.indexOf("?") === -1) {
				path = `${path}?${new URLSearchParams(params).toString()}`
			}

			navigate(
				navigateContext,
				{
					path,
					namespace,
					title,
					tags,
				},
				true
			)
		}
	}, [site])

	// Quit rendering early if we don't have our route yet
	if (!route) return null

	const { workspace, params, theme } = route
	const viewId = route.view

	let routeContext = props.context.addRouteFrame({
		route,
		viewDef: viewId,
		theme,
		view: makeViewId(viewId, "$root"),
	})

	const themeData = routeContext.getTheme()

	// activate twind - must be called at least once
	setup(
		defineConfig({
			presets: [
				presetAutoprefix(),
				presetTailwind(),
				presetContainerQueries(),
			],
			hash: false,
			theme: {
				extend: {
					colors: {
						primary: themeData.definition.palette.primary,
					},
					fontFamily: {
						sans: ["Roboto", "sans-serif"],
					},
					fontSize: {
						xxs: ["8pt", "16px"],
					},
				},
			},
		}),
		undefined,
		// This is dumb. But twind doesn't have a nice api for creating a default
		// instance without using the observer. So we can just give it an empty,
		// non-attached div to observe :)
		document.createElement("div")
	)

	// We need to process the style classes we put on the root element in index.gohtml
	styles.process(undefined, "h-screen overflow-auto hidden contents")

	if (workspace) {
		routeContext = routeContext.setWorkspace(workspace)
	}

	if (site) {
		routeContext = routeContext.setSite(site)
	}

	return (
		<>
			{workspace ? (
				<Component
					context={routeContext}
					componentType={workspace.wrapper}
					path=""
					definition={{
						view: viewId,
						params,
					}}
				/>
			) : (
				<ViewArea
					context={routeContext}
					definition={{
						view: viewId,
						params,
					}}
					path=""
				/>
			)}
			<Progress context={props.context} />
			<NotificationArea context={props.context} />
		</>
	)
}

Route.displayName = "Route"

export default Route
