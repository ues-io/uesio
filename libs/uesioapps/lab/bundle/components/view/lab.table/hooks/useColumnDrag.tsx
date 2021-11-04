import React, { useEffect, useState } from "react"
import { TableColumnDefinition } from "../../lab.tablecolumn/tablecolumndefinition"

import { component, definition } from "@uesio/ui"

type LeftRightBound = {
	left: number
	right: number
	// min: number
	// max: number
	i: number
}

// TODO
// 1. Currently, the table and column are being rerendered abusively while dragging.

export default (
	columnRefs: HTMLDivElement[],
	tableRef: React.RefObject<HTMLDivElement>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	uesio: any,
	path: string,
	dragIndicator: React.RefObject<HTMLDivElement>
) => {
	const [dragCol, setDragCol] = useState<
		(TableColumnDefinition & { index: number }) | null
	>(null)
	const [deltaX, setDeltaX] = useState<number>(0)
	const [markerPosition, setMarkerPosition] = useState<number | null>(null)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const [dragColWidth, setDragColWidth] = useState(200)
	const [showDragCol, setShowDragCol] = useState(false)

	// Get the position of the column sides
	const leftRightBoundsOfColumns: LeftRightBound[] = columnRefs.map(
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
		if (!dragCol || columnRefs.length < 2) return
		let mouseColumnOffset = 0
		// Set the width of the dragcol according to actual col width
		setDragColWidth(columnRefs[dragCol.index].offsetWidth)
		const columnWidth = columnRefs[dragCol.index].offsetWidth
		const columnLeft = leftRightBoundsOfColumns[dragCol.index].left
		if (!tableRef || !tableRef.current) return
		const { left: tableLeft, right: tableRight } =
			tableRef.current.getBoundingClientRect()

		const handleDrag = (e: any) => {
			const mouseX = e.clientX
			if (!tableRef || !tableRef.current) return

			// Fix the ghostcol to the mouse position
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
			setShowDragCol(false)
			setMarkerPosition(null)
			window.removeEventListener("mousemove", handleDrag)
		}
	}, [dragCol, columnRefs, tableRef, dragIndicator])

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

	useEffect(() => {
		window.addEventListener("mouseup", onDragEnd)
		return () => window.removeEventListener("mouseup", onDragEnd)
	}, [markerPosition, dragCol])

	return {
		setDragCol,
		showDragCol,
		markerPosition,
		deltaX,
		dragColWidth,
		dragCol,
	}
}
