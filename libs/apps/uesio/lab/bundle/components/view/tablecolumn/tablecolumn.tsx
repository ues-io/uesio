import React, { FC } from "react"
import { hooks, definition, wire } from "@uesio/ui"
import { TableColumnDefinition } from "./tablecolumndefinition"
import EmptyColumn from "../table/emptycolumn"
import useLongPress from "../table/hooks/useLongPress"

interface DragCol extends TableColumnDefinition {
	index: number
}
interface T extends definition.BaseProps {
	classes: Record<string, string>
	definition: TableColumnDefinition
	dragCol: DragCol | null
	columnRefs: React.MutableRefObject<HTMLDivElement[]>
	index: number
	markerPosition: null | number
	wire: wire.Wire
	refBox: React.ReactElement<HTMLDivElement>
	freezeColumn: boolean
	className: string
	pushHeaderCellRef: (el: HTMLDivElement) => void
	headerCellHeight: number | null
	isDragging?: boolean
	setDragCol?: (arg0: DragCol) => void
	tableRef: React.MutableRefObject<HTMLDivElement | null>
}

const TableColumn: FC<T> = (props) => {
	const {
		path,
		children,
		classes,
		index,
		dragCol,
		definition,
		markerPosition,
		context,
		wire,
		refBox,
		freezeColumn,
		className,
		pushHeaderCellRef,
		headerCellHeight,
		isDragging,
		setDragCol,
	} = props

	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()

	const getColumnLabel = (column: TableColumnDefinition): string => {
		if (!wire) return ""
		const collection = wire.getCollection()

		if (!collection || !column.components) return ""
		// Find the first component ending with '.field'
		const field = column.components.find((c: definition.DefinitionMap) => {
			const componentName = Object.keys(c)[0]
			return /(io.field)$/.test(componentName)
		}) as {
			"uesio/io.field": {
				fieldId: string
			}
		}
		if (!field) return ""
		return (
			collection.getField(field["uesio/io.field"]?.fieldId)?.getLabel() ||
			""
		)
	}

	const onMouseDown =
		setDragCol &&
		useLongPress(
			() =>
				setDragCol({
					...definition,
					index,
				}),
			100
		)

	const getStyles = (): React.CSSProperties => {
		const isFrozen = freezeColumn && index === 0
		return {
			borderLeft: markerPosition === index ? "2px solid orange" : "none",
			maxWidth: `${definition.width}px` || "initial",
			position: isFrozen ? "absolute" : "relative",
			zIndex: dragCol && dragCol.index === index ? 1 : 0,
			opacity: dragCol && dragCol.index === index ? 0.6 : 1,
			...(isFrozen && {
				top: 0,
				left: "0",
				zIndex: 1,
				borderRight: "1px solid #eee",
				transition: "all 0.3s ease",
				pointerEvents: "none",
				background: "#eee",
			}),
		}
	}

	return (
		<div className={`${classes.col} ${className}`} style={getStyles()}>
			{refBox}

			{/* Header cell */}
			<div
				onClick={(e) => {
					e.stopPropagation()
					uesio.builder.setSelectedNode(
						metadataType,
						metadataItem,
						`${path}["columns"]["${index}"]["lab.tablecolumn"]`
					)
				}}
				onMouseDown={onMouseDown}
				style={{
					height: headerCellHeight
						? `${headerCellHeight + 20}px`
						: "initial",
					marginBottom: freezeColumn && index === 0 ? "1px" : "none",
				}}
				ref={(el) => el && pushHeaderCellRef(el)}
				className={classes.headerCell}
			>
				<span>{definition.name || getColumnLabel(definition)}</span>
			</div>

			{/* Children or helper column to suggest fields */}
			{(definition.components &&
				definition.components.length > 0 &&
				children) || (
				<EmptyColumn
					wire={wire}
					index={index}
					context={context}
					path={path}
					isDragging={isDragging}
					definition={definition}
				/>
			)}
		</div>
	)
}

export default TableColumn
