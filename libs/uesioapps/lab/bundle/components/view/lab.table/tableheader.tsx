import React, { FC, useState, useEffect, useRef } from "react"
import { hooks, component, wire } from "@uesio/ui"
import { TableProps } from "./tabledefinition"
import FieldHints from "../lab.column/fieldhints"
import { TableColumnDefinition } from "../lab.tablecolumn/tablecolumndefinition"

const LabLayout = component.registry.getUtility("lab.layout")

interface T extends TableProps {
	classes: any
	wire: wire.Wire
}

const TableHeader: FC<T> = (props) => {
	const { path = "", definition, classes, wire } = props
	const uesio = hooks.useUesio(props)
	const collection = wire.getCollection()

	const [dragCol, setDragCol] = useState<any>(null)
	const [deltaX, setDeltaX] = useState<number>(0)
	const [markerPosition, setMarkerPosition] = useState<number | null>(null)

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const mouseUp = () => {
		if (markerPosition !== null && dragCol !== null) {
			if (dragCol["lab.tablecolumn"].id === "rowActions")
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

	const headerRefs = useRef<HTMLDivElement[]>([])

	useEffect(() => {
		window.addEventListener("mouseup", mouseUp)
		return () => window.removeEventListener("mouseup", mouseUp)
	}, [markerPosition])

	// Rearranging  columns
	useEffect(() => {
		if (dragCol === null) return
		let start = 0
		const handler = (e: any) => {
			const mouseX = e.clientX

			if (start === 0) start = mouseX
			setDeltaX(mouseX - start)

			const leftRightBoundsOfColumns = headerRefs.current.map((el, i) => {
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
	}, [dragCol])

	const getColumnLabel = (column: TableColumnDefinition): string => {
		if (!collection) return ""
		// Find the first component ending with '.field'
		const field = column.components.find((c) => {
			const componentName = Object.keys(c)[0]
			return /(io.field)$/.test(componentName)
		}) as {
			"io.field": {
				fieldId: string
			}
		}
		if (!field) return ""
		return collection.getField(field["io.field"]?.fieldId)?.getLabel() || ""
	}

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
									index === markerPosition
										? "8px solid orange"
										: "initial",
							}}
							onMouseDown={() => setDragCol({ ...c, index })}
							onClick={(e) => {
								e.stopPropagation()
								uesio.builder.setSelectedNode(
									metadataType,
									metadataItem,
									`${path}["columns"]["${index}"]["lab.tablecolumn"]`
								)
							}}
							ref={(el) =>
								el &&
								!headerRefs.current.includes(el) &&
								headerRefs.current.push(el)
							}
						>
							<div
								style={{
									opacity: dragCol === index ? 1 : 0,
									transform: `translateX(${deltaX}px)`,
								}}
								className={classes.dragIndicator}
							/>

							{/* Column name or first field name */}
							{column.name || getColumnLabel(column)}

							{/* Fieldhint */}
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
