import { FC, useState, useEffect } from "react"
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
		window.addEventListener("keydown", toggleFunc)

		// Remove event listeners on cleanup
		return () => {
			window.removeEventListener("keydown", toggleFunc)
		}
	}, [hotkeysAreEnabled])
	return <>{children}</>
}

export default hotkeyprovider
