import { useEffect, FunctionComponent } from "react"

import { BaseProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"
import { Context } from "../context/context"
import Route from "./route"
import routeOps from "../bands/route/operations"
import { css } from "@emotion/css"
import NotificationArea from "./notificationarea"

const Runtime: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
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
			if (event.altKey && event.code === "KeyU") {
				setBuildMode(!uesio.component.getState("buildmode"))
			}
		}
		// Handle swapping between buildmode and runtime
		// Option + U
		window.addEventListener("keyup", toggleFunc)

		window.onpopstate = (event: PopStateEvent) => {
			if (!event.state.path || !event.state.namespace) {
				// In some cases, our path and namespace aren't available in the history state.
				// If that is the case, then just punt and do a plain redirect.
				uesio.signal.dispatcher(
					routeOps.redirect(new Context(), document.location.pathname)
				)
				return
			}
			uesio.signal.dispatcher(
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
