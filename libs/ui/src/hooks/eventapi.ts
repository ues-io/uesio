import { DependencyList, useEffect } from "react"

const useEvent = (
	eventName: string,
	callback: (event: CustomEvent) => void,
	deps: DependencyList = []
) => {
	useEffect(() => {
		document.addEventListener(eventName, callback)
		return () => {
			document.removeEventListener(eventName, callback)
		}
	}, deps)
}

const publish = (eventName: string, detail?: unknown) => {
	document.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export { useEvent, publish }
