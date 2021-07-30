import { useState, useEffect } from "react"
import debounce from "lodash/debounce"
import throttle from "lodash/throttle"

export default (): [
	(arg: boolean) => void,
	(arg: { offset: number; width: number }) => void,
	{ height: number; width: number },
	string
] => {
	const [width, setWidth] = useState("22%")
	const [dragging, setDragging] = useState(false)
	const [mouseX, setMouseX] = useState(0)
	const [boxDimensions, setBoxDimensions] = useState({
		offset: 0,
		width: 0,
	})
	const [windowSize, setWindowSize] = useState({
		width: 0,
		height: 0,
	})

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			})
		}

		const debouncedHandler = debounce(() => handleResize(), 300)
		window.addEventListener("resize", debouncedHandler)

		return () => window.removeEventListener("resize", debouncedHandler)
	}, [])

	// woah not soo fast
	const throttledMouseHandler = throttle((e) => {
		setMouseX(e.clientX),
			1000,
			{
				leading: true,
				trailing: false,
			}
	})

	useEffect(() => {
		if (!dragging) return
		const { offset, width: bWidth } = boxDimensions

		const calcWidth = () => {
			const multiplier = 1 // speed factor, above 1 is faster and under 1 is slower than mouse
			const x = Math.round(
				100 * (1 - (mouseX / multiplier - offset) / bWidth)
			)
			const min = 20
			const max = 60
			if (x < min) return min
			if (x > max) return max
			return x
		}

		setWidth(calcWidth() + "%")
	}, [dragging, mouseX])

	useEffect(() => {
		document.addEventListener("mousemove", throttledMouseHandler)
		document.addEventListener("mouseup", () => setDragging(false))

		return () => {
			document.removeEventListener("mousemove", throttledMouseHandler)
			document.removeEventListener("mouseup", () => setDragging(false))
		}
	})

	return [setDragging, setBoxDimensions, windowSize, width]
}
