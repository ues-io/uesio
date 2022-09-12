import React, { useState, useRef, useEffect } from "react"
import { CSSInterpolation } from "@emotion/css"
import throttle from "lodash/throttle"

// Whenever a user scrolls on the reffed element, this hook returns css box shadow styling

export default (
	dependencies?: unknown[]
): [
	React.MutableRefObject<HTMLDivElement | null>,
	Record<string, CSSInterpolation>
] => {
	const [hasScroll, setHasScroll] = useState(false)
	const ref = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const element = ref.current
		if (!element) return

		const onScroll = () => {
			setHasScroll(element.scrollTop > 0)
		}
		const db = throttle(onScroll, 200)

		element.removeEventListener("scroll", db)
		element.addEventListener("scroll", db)
		return () => {
			element.removeEventListener("scroll", db)
		}
	}, [ref, ref.current, ...(dependencies || [])])

	return [
		ref,
		{
			transition: "all 0.3s ease",
			boxShadow: hasScroll
				? "rgb(0 0 0 / 40%) 0px 0px 20px -6px"
				: "none",
		},
	]
}
