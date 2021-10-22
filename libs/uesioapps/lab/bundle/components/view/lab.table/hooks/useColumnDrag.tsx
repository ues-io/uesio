import React, { useEffect, useState } from "react"
import { component } from "@uesio/ui"

type LeftRightBound = {
	left: number
	right: number
	min: number
	max: number
	i: number
}

// TODO
// 1. Currently, the table and column are being rerendered abusively while dragging.

export default (
	columnRefs: any,
	tableRef: any,
	uesio: any,
	path: string,
	dragIndicator: any
) => {
	const [dragCol, setDragCol] = useState<any>(null)
	const [deltaX, setDeltaX] = useState<number>(0)
	const [markerPosition, setMarkerPosition] = useState<number | null>(null)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const [dragColWidth, setDragColWidth] = useState(200)
	const [showDragCol, setShowDragCol] = useState(false)

	// Get the position of the column sides
	const leftRightBoundsOfColumns: LeftRightBound[] = columnRefs.current.map(
		(el: HTMLDivElement, i: number) => {
			const { left, right } = el.getBoundingClientRect()
			return {
				left,
				right,
				i,
			}
		}
	)

	useEffect(() => {
		if (dragCol === null || !tableRef) return
		let mouseColumnOffset = 0
		// Set the width of the dragcol according to actual col width
		setDragColWidth(columnRefs.current[dragCol.index].offsetWidth)
		const columnWidth = columnRefs.current[dragCol.index].offsetWidth
		const columnLeft = leftRightBoundsOfColumns[dragCol.index].left
		const { left: tableLeft, right: tableRight } =
			tableRef.current.getBoundingClientRect()

		const handleDrag = (e: any) => {
			const mouseX = e.clientX

			// We want the ghost column to fix to mouse position on moment of drag start
			mouseColumnOffset =
				mouseColumnOffset === 0
					? mouseX - columnLeft
					: mouseColumnOffset
			const X = mouseX - mouseColumnOffset - tableLeft
			setDeltaX(X)

			// Left side of the dragBox is over the left table edge
			if (mouseX + (columnWidth - mouseColumnOffset) > tableRight) {
				tableRef.current.scrollBy({ left: 50 })
			}

			// Right side of the dragBox is over the right table edge
			if (mouseX - mouseColumnOffset < tableLeft) {
				tableRef.current.scrollBy({ left: -50 })
			}

			// Figure out if the dragbox is within the bounds of a column
			const hoveredEl = leftRightBoundsOfColumns.find(
				({ left, right }) => left < mouseX && right > mouseX
			)

			if (!hoveredEl) return
			setMarkerPosition(hoveredEl.i)
			if (!showDragCol) setShowDragCol(true)
		}

		window.addEventListener("mousemove", handleDrag)
		return () => {
			mouseColumnOffset = 0
			console.log("STOPPING")
			setShowDragCol(false)
			setMarkerPosition(null)
			window.removeEventListener("mousemove", handleDrag)
		}
	}, [dragCol, columnRefs, tableRef, dragIndicator])

	useEffect(() => {
		if (!markerPosition) return
		window.addEventListener("mouseup", onDragEnd)
		return () => window.removeEventListener("mouseup", onDragEnd)
	}, [markerPosition])

	const onDragEnd = () => {
		if (
			markerPosition !== null &&
			dragCol !== null &&
			markerPosition !== dragCol.index
		) {
			uesio.builder.moveDefinition(
				component.path.makeFullPath(
					metadataType,
					metadataItem,
					`${path}["columns"]["${dragCol.index}"]`
				),
				component.path.makeFullPath(
					metadataType,
					metadataItem,
					`${path}["columns"]["${markerPosition}"]`
				)
			)
		}
		setDragCol(null)
	}

	return {
		setDragCol,
		showDragCol,
		markerPosition,
		deltaX,
		dragColWidth,
		dragCol,
	}
}
