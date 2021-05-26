import { useRef, useEffect } from "react"
import { panelsDomNode } from "../components/runtime"

function usePortal() {
	const rootElemRef = useRef<HTMLDivElement | null>(null)

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
