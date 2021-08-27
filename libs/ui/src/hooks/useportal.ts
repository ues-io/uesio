import { useRef, useEffect } from "react"
import { panelsDomNode } from "../components/runtime"

function usePortal(isBuilding: boolean) {
	const rootElemRef = useRef<HTMLDivElement | null>(null)
	const domNode = {
		current: isBuilding
			? document.querySelector("#mamaForPanels")
			: panelsDomNode?.current,
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
