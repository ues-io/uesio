import { useEffect, FunctionComponent } from "react"

import { BaseProps } from "../definition/definition"

import { getPlatform } from "../store/store"
import { useUesio } from "../hooks/hooks"
import { useScripts, depsHaveLoaded } from "../hooks/usescripts"
import { Context } from "../context/context"
import Route from "./route"
import routeOps from "../bands/route/operations"

const getNeededScripts = (buildMode: boolean) =>
	buildMode ? [getPlatform().getBuilderCoreURL()] : []

const Runtime: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	const buildMode = uesio.builder.useMode()
	const neededScripts = getNeededScripts(buildMode)
	const scriptResult = useScripts(neededScripts)
	const scriptsHaveLoaded = depsHaveLoaded(
		neededScripts,
		scriptResult.scripts
	)

	useEffect(() => {
		const toggleFunc = (event: KeyboardEvent): void => {
			if (event.altKey && event.code === "KeyU") {
				uesio.builder.toggleBuildMode()
			}
		}
		// Handle swapping between buildmode and runtime
		// Option + U
		window.addEventListener("keyup", toggleFunc)

		window.onpopstate = (event: PopStateEvent): void => {
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
		return (): void => {
			window.removeEventListener("keyup", toggleFunc)
		}
	}, [])

	return (
		<Route
			path={props.path}
			context={props.context.addFrame({
				buildMode: buildMode && scriptsHaveLoaded,
			})}
		/>
	)
}

Runtime.displayName = "Runtime"

export default Runtime
