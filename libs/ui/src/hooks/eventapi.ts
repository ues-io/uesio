import { DependencyList, useEffect } from "react"

const useEvent = (
	eventName: string,
	callback: () => void,
	deps: DependencyList
) => {
	useEffect(() => {
		document.addEventListener(eventName, callback)
		return () => {
			document.removeEventListener(eventName, callback)
		}
	}, deps)
}

const publish = (eventName: string) => {
	document.dispatchEvent(new CustomEvent(eventName))
}

export { useEvent, publish }
