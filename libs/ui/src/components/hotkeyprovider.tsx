import { FC, useState, useEffect } from "react"
import { appDispatch } from "../store/store"
import routeOps from "../bands/route/operations"
import { Context } from "../context/context"
import { hooks } from ".."

type T = {
	uesio: hooks.Uesio
	setBuildMode: (state: boolean) => void
}

// We don't want to enable hotkeys while the user is typing
const useEnableHotkeys = () => {
	const [enableHotkeys, setEnableHotkeys] = useState(true)

	const handleFocusIn = () => {
		const element = document.activeElement
		setEnableHotkeys(!!element && !("value" in element))
	}

	useEffect(() => {
		document.addEventListener("focusin", handleFocusIn)
		document.addEventListener("focusout", handleFocusIn)

		return () => {
			document.removeEventListener("focusin", handleFocusIn)
			document.removeEventListener("focusout", handleFocusIn)
		}
	}, [])

	return enableHotkeys
}

const hotkeyprovider: FC<T> = ({ children, uesio, setBuildMode }) => {
	const hotkeysAreEnabled = useEnableHotkeys()

	useEffect(() => {
		const toggleFunc = (event: KeyboardEvent) => {
			if (!hotkeysAreEnabled) return
			if (event.code === "KeyU")
				setBuildMode(!uesio.component.getState("buildmode"))
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
			window.removeEventListener("keydown", toggleFunc)
		}
	}, [hotkeysAreEnabled])
	return <>{children}</>
}

export default hotkeyprovider
