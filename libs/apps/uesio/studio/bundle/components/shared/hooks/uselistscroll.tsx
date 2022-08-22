import React from "react"
export default (length: number) => {
	// Scroll to the bottom of the list when adding new fields
	const itemsRef = React.useRef<(HTMLDivElement | null)[]>([])
	const prevLength = itemsRef.current.length
	React.useEffect(() => {
		itemsRef.current = itemsRef.current.slice(0, length)
		if (prevLength !== 0 && prevLength < itemsRef.current.length)
			itemsRef.current[itemsRef.current.length - 1]?.scrollIntoView({
				block: "end",
				behavior: "smooth",
			})
	}, [length])

	return itemsRef
}
