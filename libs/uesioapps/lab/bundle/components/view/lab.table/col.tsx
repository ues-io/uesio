import React, { FC, useRef, useEffect, useState } from "react"
import { component, styles, hooks } from "@uesio/ui"
import EmptyColumn from "./emptyColumn"
import { TableColumnDefinition } from "../lab.tablecolumn/tablecolumndefinition"

type T = any

const col: FC<T> = (props) => {
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
		onLongPress,
		tableHasActionsCol,
	} = props

	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const getColumnLabel = (column: TableColumnDefinition): string => {
		if (!wire) return ""
		if (definition.id === "rowActions") return "actions"
		const collection = wire.getCollection()

		if (!collection || !column.components) return ""
		// Find the first component ending with '.field'
		const field = column.components.find((c: any) => {
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
				height: refBox.innherHeight - 15,
				zIndex: 1,
				borderRight: "1px solid #eee",
				transition: "all 0.3s ease",
				pointerEvents: "none",
				background: "#eee",
			}),
		}
	}

	return (
		<div
			onMouseDown={() => onLongPress()}
			className={`${classes.col} ${className}`}
			style={getStyles()}
		>
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
				style={{
					height: headerCellHeight
						? `${headerCellHeight + 20}px`
						: "initial",
					borderBottom:
						freezeColumn && index === 0 ? "1px solid #eee" : "none",
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
					tableHasActionsCol={tableHasActionsCol}
					definition={definition}
				/>
			)}
		</div>
	)
}

export default col
