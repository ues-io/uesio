import { useEffect } from "react"
import { useRoute } from "../bands/route/selectors"
import { injectGlobal, css } from "@emotion/css"
import Progress from "./progress"
import View from "./view"
import { useSite } from "../bands/site"
import { Context } from "../context/context"
import { navigate, redirect } from "../bands/route/operations"
import NotificationArea from "./notificationarea"
import { Component } from "../component/component"
import PanelArea from "./panelarea"
import { makeViewId } from "../bands/view"
import { UtilityComponent } from "../definition/definition"
import { install, defineConfig } from "@twind/core"
import presetAutoprefix from "@twind/preset-autoprefix"
import presetTailwind from "@twind/preset-tailwind"

// activate twind - must be called at least once
install(
	defineConfig({
		presets: [presetAutoprefix(), presetTailwind()],
		hash: false,
	})
)

// This applies the global styles
injectGlobal({
	body: {
		margin: 0,
		fontFamily: "Roboto, Helvetica, Arial, sans-serif",
		fontWeight: 400,
		overflow: "auto",
		height: "100%",
	},
	/* apply a natural box layout model to all elements, but allowing components to change */
	html: {
		overflow: "auto",
		height: "100vh",
	},
})

const Route: UtilityComponent = (props) => {
	const site = useSite()
	const route = useRoute()

	useEffect(() => {
		if (!route) return
		const { namespace, path, workspace } = route
		// This makes sure that the namespace and path of the route is specified in the history.
		window.history.replaceState(
			{
				namespace,
				path,
				workspace,
			},
			""
		)
	})

	useEffect(() => {
		window.onpopstate = (event: PopStateEvent) => {
			const { path, workspace, namespace, title, tags } = event.state

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
	}, [])

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

	if (workspace) {
		routeContext = routeContext.setWorkspace(workspace)
	}

	if (site) {
		routeContext = routeContext.setSite(site)
	}

	const routeContextWithSlot = workspace?.slotwrapper
		? routeContext.setCustomSlot(workspace.slotwrapper)
		: routeContext

	// View and PanelArea both need their own unique context stacks in order to prevent issues,
	// so we need to generate a unique context stack for each by cloning
	const view = (
		<>
			<View
				context={routeContextWithSlot}
				definition={{
					view: viewId,
					params,
				}}
				path=""
			/>
			<PanelArea context={routeContextWithSlot} />
		</>
	)

	return (
		<>
			{workspace ? (
				<Component
					context={routeContext}
					componentType={workspace.wrapper}
					path=""
					definition={{}}
				>
					{view}
				</Component>
			) : (
				view
			)}
			<Progress isAnimating={!!route.isLoading} context={props.context} />
			<div
				className={css({
					position: "fixed",
					right: "2em",
					bottom: "2em",
					display: "grid",
					rowGap: "10px",
					marginLeft: "2em",
					width: "350px",
				})}
			>
				<NotificationArea context={props.context} />
			</div>
		</>
	)
}

Route.displayName = "Route"

export default Route
