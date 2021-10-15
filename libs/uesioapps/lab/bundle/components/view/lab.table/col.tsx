import React, { FC, useRef, useEffect, useState } from "react"
import { component, styles, hooks } from "@uesio/ui"
import EmptyColumn from "./emptyColumn"
type T = any
type LeftRightBound = {
	left: number
	right: number
	min: number
	max: number
	i: number
}

const useColumnDrag = ({
	uesio,
	path,
	columnRefs,
	markerPosition,
	setMarkerPosition,
	tableRef,
}: any) => {
	const [dragCol, setDragCol] = useState<any>(null)
	const [deltaX, setDeltaX] = useState<number>(0)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	useEffect(() => {
		console.log({ markerPosition })
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
				min: -(left - tableLeft),
				max: tableRight - right,
				i,
			}
		}
	)

	// Rearranging  columns
	useEffect(() => {
		if (dragCol === null) return
		let start = 0
		const handler = (e: any) => {
			const mouseX = e.clientX

			if (start === 0) start = mouseX

			// Ensure we don't slide too much left or right
			const newPos = mouseX - start
			const { min, max } = leftRightBoundsOfColumns[dragCol.index]
			const firstPass = newPos < min ? min : newPos
			const secondPass = firstPass < max ? firstPass : max
			setDeltaX(secondPass)

			// Figure out if the dragbox is within the bounds of a column
			const hoveredEl = leftRightBoundsOfColumns.find(
				({ left, right }) => left < mouseX && right > mouseX
			)
			if (!hoveredEl) return
			setMarkerPosition(hoveredEl.i)
		}

		window.addEventListener("mousemove", handler)
		return () => {
			window.removeEventListener("mousemove", handler)
		}
	}, [dragCol, columnRefs])

	const onDragEnd = () => {
		if (markerPosition !== null && dragCol !== null) {
			// The row actions column logic is tied to the table properties, not the column
			if (dragCol.id === "rowActions")
				return uesio.builder.setDefinition(
					component.path.makeFullPath(
						metadataType,
						metadataItem,
						`${path}["rowActionsColumnPosition"]`
					),
					markerPosition + 1
				)

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
	return { dragCol, setDragCol, deltaX, markerPosition }
}

const col: FC<T> = (props) => {
	const {
		path,
		children,
		classes,
		index,
		definition,
		columnRefs,
		markerPosition,
		setMarkerPosition,
		tableRef,
		context,
		wire,
		refBox,
	} = props
	const uesio = hooks.useUesio(props)
	const dragBox = useRef<HTMLDivElement>(null)

	const { setDragCol, dragCol, deltaX } = useColumnDrag({
		uesio,
		path,
		columnRefs,
		markerPosition,
		setMarkerPosition,
		tableRef,
	})

	return (
		<div
			onMouseDown={() => setDragCol({ ...definition, index })}
			className={classes.col}
			style={{
				position: "relative",
				opacity: dragCol && dragCol.index === index ? 0.6 : 1,
				zIndex: dragCol && dragCol.index === index ? 1 : 0,
				borderLeft:
					markerPosition === index ? "2px solid orange" : "none",
			}}
		>
			{refBox}
			<div
				ref={dragBox}
				style={{
					zIndex: dragCol && dragCol.index ? 10 : 0,

					opacity: dragCol && dragCol.index === index ? 1 : 0,
					transform: `translateX(${deltaX}px)`,
				}}
				className={classes.dragIndicator}
			/>
			{(definition.components.length > 0 && children) || (
				<EmptyColumn
					wire={wire}
					index={index}
					context={context}
					path={path}
				/>
			)}
		</div>
	)
}

export default col
