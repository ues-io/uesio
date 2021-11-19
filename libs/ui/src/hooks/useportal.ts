import { useRef, useEffect } from "react"
import { panelsDomNode } from "../components/view"

function usePortal() {
	const rootElemRef = useRef<HTMLDivElement | null>(null)
	if (!panelsDomNode || !panelsDomNode.current)
		console.warn("usePortal error: panelsDomNode not found")
	useEffect(() => {
		// Add the detached element to the parent
		rootElemRef.current &&
			panelsDomNode?.current?.appendChild(rootElemRef.current)

		return function removeElement() {
			rootElemRef.current?.remove()
		}
	}, [])

	function getRootElem() {
		if (!rootElemRef.current) {
			rootElemRef.current = document.createElement("div")
		}
		return rootElemRef.current
	}

	return getRootElem()
}

export default usePortal
