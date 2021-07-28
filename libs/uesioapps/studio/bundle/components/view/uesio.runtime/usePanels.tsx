import { useState, useEffect } from "react"
import _ from "lodash"

export default (): [
	(arg: boolean) => void,
	(arg: { offset: number; width: number }) => void,
	number
] => {
	const [width, setWidth] = useState(40)
	const [dragging, setDragging] = useState(false)
	const [mouseX, setMouseX] = useState(0)
	const [boxDimensions, setBoxDimensions] = useState({
		offset: 0,
		width: 0,
	})

	// woah not soo fast
	const throttledMouseHandler = _.throttle((e) => {
		setMouseX(e.clientX),
			1000,
			{
				leading: true,
				trailing: false,
			}
	})

	useEffect(() => {
		if (!dragging) return

		const boxOffset = boxDimensions.offset
		const boxWidth = boxDimensions.width

		const calcWidth = (x: number) => {
			const min = 20
			const max = 60

			if (x < min) return min
			if (x > max) return max
			return x
		}
		const x =
			(Math.round(((mouseX - boxOffset) / boxWidth) * 1000) / 10 - 100) *
			-1

		const newWidth = calcWidth(x)
		setWidth(newWidth)
		// debounceMonacoResize()
	}, [dragging, mouseX])

	useEffect(() => {
		document.addEventListener("mousemove", throttledMouseHandler)
		document.addEventListener("mouseup", () => setDragging(false))

		return () => {
			document.removeEventListener("mousemove", throttledMouseHandler)
			document.removeEventListener("mouseup", () => setDragging(false))
		}
	})

	return [setDragging, setBoxDimensions, width]
}
