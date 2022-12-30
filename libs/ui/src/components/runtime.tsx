import { FunctionComponent, RefObject, useEffect, useRef } from "react"

import { BaseProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"
import Route from "./route"
import { css } from "@emotion/css"
import NotificationArea from "./notificationarea"
import { Context } from "../context/context"
import routeOps from "../bands/route/operations"
import { useHotKeyCallback } from "../hooks/hotkeys"

let portalsDomNode: RefObject<HTMLDivElement> | undefined = undefined

const Runtime: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)

	portalsDomNode = useRef<HTMLDivElement>(null)

	const viewContext = props.context.addFrame({
		view: "$root",
	})

	const componentId = uesio.component.getComponentId(
		"buildmode",
		// Hardcode the component type since this component is called
		// in an unusual way by the loader
		"uesio/builder.runtime",
		props.path,
		viewContext
	)
	const [buildMode, setBuildMode] = uesio.component.useState<boolean>(
		componentId,
		false
	)

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

	useHotKeyCallback("command+u", () => {
		setBuildMode(!buildMode)
	})

	const buildContext = viewContext.addFrame({
		buildMode,
	})

	if (buildMode === undefined) return null

	return (
		<>
			<Route path={props.path} context={buildContext} />
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

export default Runtime
