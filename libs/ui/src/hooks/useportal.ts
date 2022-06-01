import { useRef, useEffect } from "react"
import { panelsDomNode } from "../components/view"

function usePortal() {
	const rootElemRef = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (!panelsDomNode || !panelsDomNode.current)
			console.warn("usePortal error: panelsDomNode not found")
		// Add the detached element to the parent
		rootElemRef.current &&
			panelsDomNode?.current?.appendChild(rootElemRef.current)

		return function removeElement() {
			rootElemRef.current?.remove()
		}
	}, [])

	if (!rootElemRef.current) {
		rootElemRef.current = document.createElement("div")
	}
	return rootElemRef.current
}

export default usePortal
