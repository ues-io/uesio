import { useEffect, FunctionComponent, useRef, RefObject } from "react"

import { BaseProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"
import { Context } from "../context/context"
import Route from "./route"
import routeOps from "../bands/route/operations"
import { css } from "@emotion/css"
import NotificationArea from "./notificationarea"
import { useBeforeunload } from "react-beforeunload"

let panelsDomNode: RefObject<HTMLDivElement> | undefined = undefined

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
	const deps = buildMode ? ["studio.main", "io.main"] : []
	const scriptResult = uesio.component.usePacks(deps, !!buildMode)
	const hasChanges = uesio.builder.useHasChanges()

	useBeforeunload((event) => {
		if (hasChanges) {
			event.preventDefault()
		}
	})

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
					event.state.path,
					event.state.namespace,
					true
				)
			)
		}

		// Remove event listeners on cleanup
		return () => {
			window.removeEventListener("keyup", toggleFunc)
		}
	}, [])

	panelsDomNode = useRef<HTMLDivElement>(null)

	const context = uesio.getContext().addFrame({
		buildMode: buildMode && scriptResult.loaded,
	})

	if (buildMode === undefined) return null

	return (
		<>
			<Route path={props.path} context={context} />
			<div ref={panelsDomNode} />
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

export { panelsDomNode }
export default Runtime
