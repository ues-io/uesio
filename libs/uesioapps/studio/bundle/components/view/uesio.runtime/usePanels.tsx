import { useState, useEffect } from "react"
import throttle from "lodash/throttle"

export default (
	element: HTMLDivElement | null
): [(arg: boolean) => void, number] => {
	const [width, setWidth] = useState(300)
	const [dragging, setDragging] = useState(false)
	const panelPosition = element?.getBoundingClientRect().left

	// woah not soo fast
	const throttledMouseHandler = throttle((e) => {
		if (!dragging) return

		const mouseX = e.clientX

		if (!panelPosition || !mouseX) return
		const change = panelPosition - mouseX
		const x = width + change
		const min = 250
		const max = 600

		if (x < min) {
			setWidth(min)
			return
		}
		if (x > max) {
			setWidth(max)
			return
		}

		setWidth(x)
	}, 50)

	useEffect(() => {
		if (!dragging) return
		document.addEventListener("mousemove", throttledMouseHandler)
		document.addEventListener("mouseup", () => setDragging(false))

		return () => {
			document.removeEventListener("mousemove", throttledMouseHandler)
			document.removeEventListener("mouseup", () => setDragging(false))
		}
	}, [dragging])

	return [setDragging, width]
}
