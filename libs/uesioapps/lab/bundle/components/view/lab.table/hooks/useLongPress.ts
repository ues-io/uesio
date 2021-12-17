import { useState, useEffect } from "react"

export default (cb: (...args: unknown[]) => unknown, threshold: number) => {
	const [isDown, setIsDown] = useState(false)

	const onMouseUp = () => setIsDown(false)
	const onMouseDown = () => setIsDown(true)
	document.addEventListener("mouseup", onMouseUp)

	useEffect(() => {
		const timer = setTimeout(() => {
			isDown && cb()
		}, threshold)

		return () => {
			clearTimeout(timer)
			document.removeEventListener("mouseup", onMouseUp)
		}
	}, [isDown])
	return onMouseDown
}
