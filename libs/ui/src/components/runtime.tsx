import { useEffect, FunctionComponent } from "react"

import { BaseProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"
import { Context } from "../context/context"
import Route from "./route"
import routeOps from "../bands/route/operations"
import { css } from "@emotion/css"
import NotificationArea from "./notificationarea"
import { appDispatch } from "../store/store"

const Runtime: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	// Hardcode the component type since this component is called
	// in an unusual way by the loader
	uesio._componentType = "uesio/studio.runtime"

	uesio.addContextFrame({
		view: "$root",
	})
	const [buildMode, setBuildMode] = uesio.component.useState<boolean>(
		"buildmode",
		false
	)

	// This tells us to load in the studio main component pack if we're in buildmode
	const deps = buildMode ? ["uesio/studio.main", "uesio/io.main"] : []
	const scriptResult = uesio.component.usePacks(deps, !!buildMode)

	useEffect(() => {
		const toggleFunc = (event: KeyboardEvent) => {
			if (event.metaKey && event.code === "KeyU") {
				setBuildMode(!uesio.component.getState("buildmode"))
			}
		}
		// Handle swapping between buildmode and runtime
		// Option + U
		window.addEventListener("keydown", toggleFunc)

		window.onpopstate = (event: PopStateEvent) => {
			if (!event.state.path || !event.state.namespace) {
				// In some cases, our path and namespace aren't available in the history state.
				// If that is the case, then just punt and do a plain redirect.
				appDispatch()(
					routeOps.redirect(new Context(), document.location.pathname)
				)
				return
			}
			appDispatch()(
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
			)
		}

		// Remove event listeners on cleanup
		return () => {
			window.removeEventListener("keyup", toggleFunc)
		}
	}, [])

	const context = uesio.getContext().addFrame({
		buildMode: buildMode && scriptResult.loaded,
	})

	if (buildMode === undefined) return null

	return (
		<>
			<Route path={props.path} context={context} />
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

export default Runtime
