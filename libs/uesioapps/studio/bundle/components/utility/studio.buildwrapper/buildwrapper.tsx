import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"
import { handleDrop, isDropAllowed } from "../../shared/dragdrop"

interface BuildWrapperProps extends definition.UtilityProps {
	test?: string
}

const ACTIVE_COLOR = "#eee"
const SELECTED_COLOR = "#aaa"
const INACTIVE_COLOR = "#eee"

const BuildWrapper: FunctionComponent<BuildWrapperProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { children, path = "", index = 0 } = props
	const viewDefId = uesio.getViewDefId()

	const [canDrag, setCanDrag] = useState<boolean>(false)

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const [dropType, dropItem, dropPath] = uesio.builder.useDropNode()
	const fullDragPath = component.path.makeFullPath(
		dragType,
		dragItem,
		dragPath
	)

	const nodeState = uesio.builder.useNodeState("viewdef", viewDefId, path)
	const isActive = nodeState === "active"
	const isSelected = nodeState === "selected"

	const isStructureView = uesio.builder.useIsStructureView()
	const isContentView = !isStructureView
	const showHeader = isStructureView || (isContentView && isSelected)

	const wrapperPath = component.path.getGrandParentPath(path)

	const isDraggingMe =
		path === dragPath && dragType === "viewdef" && dragItem === viewDefId
	const addBeforePlaceholder = `${wrapperPath}["${index}"]` === dropPath
	const addAfterPlaceholder = `${wrapperPath}["${index + 1}"]` === dropPath

	const deepShadow =
		"0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)"
	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "relative",
				userSelect: "none",
				...(isStructureView && {
					border: `1px solid ${
						isSelected ? SELECTED_COLOR : INACTIVE_COLOR
					}`,
				}),
				...(isContentView && {
					position: "relative",
				}),
				...(isDraggingMe && {
					display: "none",
				}),
			},
			placeholder: {
				minWidth: "40px",
				minHeight: "40px",
				border: "1px dashed #ccc",
				backgroundColor: "#e5e5e5",
			},
			afterPlaceholder: {
				display: "none",
				"&:last-child": {
					display: "block",
				},
			},
			header: {
				color: "#333",
				fontWeight: "bold",
				backgroundColor: isSelected ? "white" : "transparent",
				padding: "10px",
				textTransform: "uppercase",
				fontSize: "9pt",
				...(isContentView && {
					boxShadow: isSelected ? deepShadow : "none",
					outline:
						isActive || isSelected
							? `1px solid ${
									isSelected ? SELECTED_COLOR : ACTIVE_COLOR
							  }`
							: "none",
					position: "absolute",
					top: "-34px",
					left: "-8px",
					right: "-8px",
					bottom: "-8px",
				}),
			},
			inner: {
				...(isStructureView && {
					padding: "8px",
				}),
				position: "relative",
				overflow: "auto",
			},
		},
		props
	)

	if (!viewDefId) return null

	const propDef = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath("viewdef", viewDefId, path)
	)
	const accepts = propDef?.accepts

	const onDragStart = (e: DragEvent) => {
		e.stopPropagation()
		setTimeout(() => {
			if (dragPath !== path) {
				uesio.builder.setDragNode("viewdef", viewDefId, path)
			}
		})
	}

	const onDragEnd = (e: DragEvent) => {
		uesio.builder.clearDragNode()
		uesio.builder.clearDropNode()
	}

	const onDragOver = (e: DragEvent) => {
		if (!accepts) return
		if (!isDropAllowed(accepts, fullDragPath)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		uesio.builder.setDropNode("viewdef", viewDefId, path)
	}

	const onDrop = (e: DragEvent) => {
		if (!accepts) return
		if (!isDropAllowed(accepts, fullDragPath)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		handleDrop(
			fullDragPath,
			component.path.makeFullPath("viewdef", viewDefId, path),
			0,
			uesio
		)
	}

	return (
		<>
			{addBeforePlaceholder && <div className={classes.placeholder} />}
			<div
				data-index={index}
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				onDragOver={onDragOver}
				onDrop={onDrop}
				className={classes.root}
				onClick={(event: SyntheticEvent) => {
					!isSelected &&
						uesio.builder.setSelectedNode(
							"viewdef",
							viewDefId,
							path
						)
					event.stopPropagation()
				}}
				onMouseEnter={() => {
					!isActive &&
						uesio.builder.setActiveNode("viewdef", viewDefId, path)
				}}
				onMouseLeave={() => {
					isActive && uesio.builder.clearActiveNode()
				}}
				draggable={canDrag}
			>
				{showHeader && (
					<div
						className={classes.header}
						onMouseDown={() => {
							if (!isStructureView) {
								return
							}
							setCanDrag(true)
						}}
						onMouseUp={() => {
							if (!isStructureView) {
								return
							}
							if (dragPath) {
								setCanDrag(false)
							}
						}}
					>
						{propDef?.title ?? "Unknown"}
					</div>
				)}
				<div className={classes.inner}>{children}</div>
			</div>
			{addAfterPlaceholder && (
				<div
					className={styles.cx(
						classes.placeholder,
						classes.afterPlaceholder
					)}
				/>
			)}
		</>
	)
}

export default BuildWrapper
