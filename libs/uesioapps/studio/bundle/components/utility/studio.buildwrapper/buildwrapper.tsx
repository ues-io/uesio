import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"
import {
	handleDrop,
	getDropIndex,
	isDropAllowed,
	isNextSlot,
} from "../../shared/dragdrop"

interface BuildWrapperProps extends definition.UtilityProps {
	test?: string
}

const ACTIVE_COLOR = "#eee"
const SELECTED_COLOR = "#aaa"
const INACTIVE_COLOR = "#eee"

const BuildWrapper: FunctionComponent<BuildWrapperProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { children, path = "", index = 0 } = props

	const propDef = component.registry.getPropertiesDefinitionFromPath(path)

	const [canDrag, setCanDrag] = useState<boolean>(false)

	const dragNode = uesio.builder.useDragNode()
	const dropNode = uesio.builder.useDropNode()

	const nodeState = uesio.builder.useNodeState(path)
	const isActive = nodeState === "active"
	const isSelected = nodeState === "selected"

	const isStructureView = uesio.builder.useIsStructureView()
	const isContentView = !isStructureView
	const showHeader = isStructureView || (isContentView && isSelected)

	const accepts = propDef?.accepts

	const wrapperPath = component.path.getGrandParentPath(path)

	const isDraggingMe = path === dragNode
	const addBeforePlaceholder = `${wrapperPath}["${index}"]` === dropNode
	const addAfterPlaceholder = `${wrapperPath}["${index + 1}"]` === dropNode

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
			},
		},
		props
	)

	const onDragStart = (e: DragEvent) => {
		e.stopPropagation()
		setTimeout(() => {
			if (dragNode !== path) {
				uesio.builder.setDragNode(path)
			}
		})
	}

	const onDragEnd = (e: DragEvent) => {
		uesio.builder.setDragNode("")
		uesio.builder.setDropNode("")
	}

	const onDragOver = (e: DragEvent) => {
		//const target = e.target as Element | null
		if (!accepts) return
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		//console.log(target)
		uesio.builder.setDropNode(path)
	}

	const onDrop = (e: DragEvent) => {
		if (!accepts) return
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		handleDrop(dragNode, path, 0, uesio)
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
					!isSelected && uesio.builder.setSelectedNode(path)
					event.stopPropagation()
				}}
				onMouseEnter={() => {
					!isActive && uesio.builder.setActiveNode(path)
				}}
				onMouseLeave={() => {
					isActive && uesio.builder.setActiveNode("")
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
							if (dragNode) {
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
