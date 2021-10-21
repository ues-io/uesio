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
// 2. When dragging a column to the position of the rowActionsColumn, things get messy

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

	useEffect(() => {
		window.addEventListener("mouseup", onDragEnd)
		return () => window.removeEventListener("mouseup", onDragEnd)
	}, [markerPosition])

	const leftRightBoundsOfColumns: LeftRightBound[] = columnRefs.current.map(
		(el: HTMLDivElement, i: number) => {
			const { left, right } = el.getBoundingClientRect()
			const { left: tableLeft, right: tableRight } =
				tableRef.current.getBoundingClientRect()
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
		const columnRight = leftRightBoundsOfColumns[dragCol.index].right

		const handler = (e: any) => {
			// Ensure we don't slide too much left or right
			const { left: tableLeft, right: tableRight } =
				tableRef.current.getBoundingClientRect()

			// We want the ghost column to fix to mouse position on moment of drag start
			const mouseX = e.clientX

			mouseColumnOffset =
				mouseColumnOffset === 0
					? mouseX - columnLeft
					: mouseColumnOffset
			const X = mouseX - mouseColumnOffset - tableLeft
			setDeltaX(X)
			// const mouseMove = mouseX - columnLeft - mouseColumnOffset

			if (mouseX + (columnWidth - mouseColumnOffset) > tableRight) {
				tableRef.current.scrollBy({ left: 50 })
			}
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

		window.addEventListener("mousemove", handler)
		return () => {
			mouseColumnOffset = 0
			setShowDragCol(false)
			setMarkerPosition(null)
			window.removeEventListener("mousemove", handler)
		}
	}, [dragCol, columnRefs, tableRef, dragIndicator])

	const onDragEnd = () => {
		if (
			markerPosition !== null &&
			dragCol !== null &&
			markerPosition !== dragCol.index
		) {
			console.log({ dragCol })
			// The row actions column logic is tied to the table properties, not the column
			if (dragCol.id === "rowActions") {
				console.log({ x: markerPosition + 1 })
				return uesio.builder.setDefinition(
					component.path.makeFullPath(
						metadataType,
						metadataItem,
						`${path}["rowActionsColumnPosition"]`
					),
					markerPosition + 1
				)
			}

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
			console.log({
				from: `${path}["columns"]["${dragCol.index}"]`,
				to: `${path}["columns"]["${markerPosition}"]`,
			})
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
