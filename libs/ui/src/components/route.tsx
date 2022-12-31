import { FC, useEffect, RefObject, useRef } from "react"
import { BaseProps } from "../definition/definition"
import { useRoute } from "../bands/route/selectors"
import { injectGlobal, css } from "@emotion/css"
import Progress from "./progress"
import View from "./view/view"
import { useSite } from "../bands/site"
import { Context } from "../context/context"
import routeOps from "../bands/route/operations"
import NotificationArea from "./notificationarea"

// This applies the global styles
injectGlobal({
	body: {
		margin: 0,
		fontFamily: "Roboto, Helvetica, Arial, sans-serif",
		fontWeight: 400,
	},
	/* apply a natural box layout model to all elements, but allowing components to change */
	html: {
		boxSizing: "border-box",
	},
	"*": {
		boxSizing: "inherit",
	},
})

let portalsDomNode: RefObject<HTMLDivElement> | undefined = undefined

const Route: FC<BaseProps> = (props) => {
	portalsDomNode = useRef<HTMLDivElement>(null)

	const site = useSite()
	const route = useRoute()

	const routeContext = props.context.addFrame({
		site,
		route,
		workspace: route?.workspace,
		viewDef: route?.view,
		theme: route?.theme,
	})

	useEffect(() => {
		if (!route) return
		// This makes sure that the namespace and path of the route is specified in the history.
		window.history.replaceState(
			{
				namespace: route.namespace,
				path: route.path,
				workspace: route.workspace,
			},
			""
		)
	})

	useEffect(() => {
		window.onpopstate = (event: PopStateEvent) => {
			if (!event.state.path || !event.state.namespace) {
				// In some cases, our path and namespace aren't available in the history state.
				// If that is the case, then just punt and do a plain redirect.
				routeOps.redirect(new Context(), document.location.pathname)
				return
			}
			routeOps.navigate(
				new Context([
					{
						workspace: event.state.workspace,
					},
				]),
				{
					path: event.state.path,
					namespace: event.state.namespace,
				},
				true
			)
		}
	}, [])

	// Quit rendering early if we don't have our theme yet.
	if (!route) return null

	return (
		<>
			<View
				context={routeContext}
				definition={{
					view: route.view,
					params: route.params,
				}}
			/>
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
			<div ref={portalsDomNode} />
		</>
	)
}

export { portalsDomNode }

export default Route
