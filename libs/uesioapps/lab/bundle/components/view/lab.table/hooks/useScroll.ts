import { useEffect, useState } from "react"

// [ React.MutableRefObject<HTMLDivElement | null>, boolean]
export default (tableRef: React.MutableRefObject<HTMLDivElement | null>) => {
	const [hasScrolled, setHasScrolled] = useState(false)

	useEffect(() => {
		const handleScroll = (e: Event) => {
			const { scrollLeft } = e.target as HTMLDivElement
			setHasScrolled(scrollLeft > 0)
		}
		tableRef.current?.addEventListener("scroll", handleScroll)
		return () => {
			tableRef.current?.removeEventListener("scroll", handleScroll)
		}
	}, [tableRef])

	return hasScrolled
}
