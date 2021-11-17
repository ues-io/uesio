import { useRef, useEffect } from "react"
import { panelsDomNode } from "../components/view"

function usePortal() {
	const rootElemRef = useRef<HTMLDivElement | null>(null)
	const domNode = {
		current: panelsDomNode?.current,
	}

	if (!domNode.current) console.warn("usePortal error: domNode not found")
	useEffect(() => {
		// Add the detached element to the parent
		rootElemRef.current &&
			domNode?.current?.appendChild(rootElemRef.current)

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
