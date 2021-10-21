import { useState, useRef, useEffect, useMemo, useCallback } from "react"

type CellRef = HTMLDivElement

// Identify and return heighest element from an array of elements
// Used for uqualizing cell heights in table body and header

// Todo:
// 1. when window gets bigger and text unwraps, the cellheight doesn't decrease
// 2. The handler runs too often, for instance when you drag columns around.

export default (
	eager?: boolean
): [number | null, (arg0: CellRef) => void, () => void] => {
	const [cellHeight, setCellHeight] = useState<number | null>(null)
	const cellRefs = useRef<CellRef[]>([])

	const pushCellRef = (el: CellRef) => {
		const { current } = cellRefs
		!current.includes(el) && current.push(el)
	}

	const getHeighestCell = (nodes: CellRef[]) =>
		Math.max(
			...nodes.map((n) => {
				// We want the height of the content because the parent will never change size if we hardcode the height.
				const child = n.firstElementChild as HTMLElement
				return child?.offsetHeight
			})
		)

	// Idea: debounce.. this is running too often
	const handler = () => {
		if (!cellRefs.current.length) return
		const x = getHeighestCell(cellRefs.current)
		if (x !== cellHeight) return setCellHeight(x)
	}

	useEffect(() => {
		window.addEventListener("resize", handler)

		if (eager) {
			const x = getHeighestCell(cellRefs.current)
			if (x !== cellHeight) return setCellHeight(x)
		}

		return () => {
			window.removeEventListener("resize", handler)
		}
	}, [cellRefs.current.length])

	return [cellHeight, pushCellRef, handler]
}
