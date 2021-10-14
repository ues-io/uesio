import React, { FC, useRef, useEffect, useState } from "react"
import { component, styles, hooks } from "@uesio/ui"

type T = any

const useColumnDrag = ({
	metadataType,
	metadataItem,
	uesio,
	path,
	columnRefs,
	markerPosition,
	setMarkerPosition,
}: any) => {
	const [dragCol, setDragCol] = useState<any>(null)
	const [deltaX, setDeltaX] = useState<number>(0)

	useEffect(() => {
		console.log({ markerPosition })
		window.addEventListener("mouseup", onDragEnd)
		return () => window.removeEventListener("mouseup", onDragEnd)
	}, [markerPosition])

	// Rearranging  columns
	useEffect(() => {
		if (dragCol === null) return
		let start = 0
		const handler = (e: any) => {
			const mouseX = e.clientX

			if (start === 0) start = mouseX
			setDeltaX(mouseX - start)

			const leftRightBoundsOfColumns: {
				left: number
				right: number
				i: number
			}[] = columnRefs.current.map((el: HTMLDivElement, i: number) => {
				const { left, right } = el.getBoundingClientRect()
				return { left, right, i }
			})

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
			// if (dragCol["lab.tablecolumn"].id === "rowActions")
			// 	return uesio.builder.setDefinition(
			// 		component.path.makeFullPath(
			// 			metadataType,
			// 			metadataItem,
			// 			`${path}["rowActionsColumnPosition"]`
			// 		),
			// 		markerPosition + 1
			// 	)

			console.log({
				from: `${path}["columns"]["${dragCol.index}"]`,
				to: `${path}["columns"]["${markerPosition}"]`,
			})

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
	} = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const { setDragCol, dragCol, deltaX } = useColumnDrag({
		metadataType,
		metadataItem,
		uesio,
		path,
		columnRefs,
		markerPosition,
		setMarkerPosition,
	})
	return (
		<div
			onMouseDown={() => setDragCol({ ...definition, index })}
			className={classes.col}
			style={{
				borderLeft:
					markerPosition === index ? "2px solid orange" : "none",
			}}
		>
			<div
				style={{
					opacity: dragCol && dragCol.index === index ? 1 : 0,
					transform: `translateX(${deltaX}px)`,
				}}
				className={classes.dragIndicator}
			/>
			{children}
		</div>
	)
}

export default col
