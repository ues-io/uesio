import { useEffect, useState, useRef } from "react"

// [ React.MutableRefObject<HTMLDivElement | null>, boolean]
export default (tableRef: React.MutableRefObject<HTMLDivElement | null>) => {
	const [hasScrolled, setHasScrolled] = useState(false)

	useEffect(() => {
		const handleScroll = (e: any) => {
			setHasScrolled(e.target.scrollLeft > 0)
		}
		tableRef.current?.addEventListener("scroll", handleScroll)
		return () => {
			tableRef.current?.removeEventListener("scroll", handleScroll)
		}
	}, [tableRef])

	return hasScrolled
}
