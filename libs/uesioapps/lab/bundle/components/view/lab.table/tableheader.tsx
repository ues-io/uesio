import React, { FC, useState, useEffect, useRef } from "react"
import { hooks, component, builder, wire } from "@uesio/ui"
import { TableProps } from "./tabledefinition"
import FieldHints from "../lab.column/fieldhints"

const LabLayout = component.registry.getUtility("lab.layout")

interface T extends TableProps {
	classes: any
	wire: wire.Wire
}

const TableHeader: FC<T> = (props) => {
	const { path = "", definition, classes, wire } = props
	const uesio = hooks.useUesio(props)
	const collection = wire.getCollection()

	const [dragCol, setDragCol] = useState<number | null>(null)
	const [slideX, setSlideX] = useState<number>(0)
	const [showMarker, setShowMarker] = useState<number | null>(null)

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const mouseUp = () => {
		if (showMarker !== null && dragCol !== null) {
			uesio.builder.moveDefinition(
				component.path.makeFullPath(
					metadataType,
					metadataItem,
					`${path}["columns"]["${dragCol}"]`
				),
				component.path.makeFullPath(
					metadataType,
					metadataItem,
					`${path}["columns"]["${showMarker}"]`
				)
			)
		}
		setDragCol(null)
	}

	const headerRefs = useRef<HTMLDivElement[]>([])

	// Rearranging  columns
	useEffect(() => {
		if (dragCol === null) return
		let start = 0
		const handler = (e) => {
			const mouseX = e.clientX

			if (start === 0) start = mouseX
			setSlideX(mouseX - start)

			const leftRightBoundsOfColumns = headerRefs.current.map((el, i) => {
				const { left, right } = el.getBoundingClientRect()
				return { left, right, i }
			})

			// Figure out if the dragbox is within the bounds bounds of another column
			const hoveredEl = leftRightBoundsOfColumns.find(
				({ left, right }) => left < mouseX && right > mouseX
			)
			if (!hoveredEl) return
			setShowMarker(hoveredEl.i)
		}

		window.addEventListener("mousemove", handler)
		return () => {
			window.removeEventListener("mousemove", handler)
			setShowMarker(null)
		}
	}, [dragCol])

	return (
		<LabLayout classes={classes} context={props.context}>
			{definition.columns.length &&
				definition.columns.map((c, index) => {
					const column = Object.values(c)[0]
					return (
						<div
							key={index}
							className={classes.column}
							style={{
								borderLeft:
									index === showMarker
										? "8px solid orange"
										: "initial",
							}}
							onMouseDown={() => setDragCol(index)}
							onClick={(e) => {
								e.stopPropagation()
								uesio.builder.setSelectedNode(
									metadataType,
									metadataItem,
									`${path}["columns"]["${index}"]["lab.tablecolumn"]`
								)
							}}
							onMouseUp={() => mouseUp()}
							ref={(el) =>
								el &&
								!headerRefs.current.includes(el) &&
								headerRefs.current.push(el)
							}
						>
							<div
								style={{
									opacity: dragCol === index ? 1 : 0,
									transform: `translateX(${slideX}px)`,
								}}
								className={classes.dragIndicator}
							/>
							{column.name ||
								(collection &&
									collection
										.getField(column.field)
										?.getLabel())}
							{!column.name &&
								wire &&
								!column.components.length && (
									<FieldHints
										{...props}
										wire={wire}
										path={`${path}["columns"]["${index}"]["lab.tablecolumn"]["components"]`}
									/>
								)}
						</div>
					)
				})}
		</LabLayout>
	)
}

export default TableHeader
