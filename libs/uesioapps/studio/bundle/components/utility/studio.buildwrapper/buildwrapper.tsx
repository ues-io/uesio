import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import {
	definition,
	styles,
	component,
	hooks,
	metadata,
	collection,
} from "@uesio/ui"
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
	const { children, definition, path = "", index = 0 } = props

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

	const accepts = ["uesio.standalone"]
	const direction = "horizontal"

	const isHorizontal = direction === "horizontal"
	const isVertical = !isHorizontal
	const wrapperPath = component.path.getGrandParentPath(path)

	const isDragging = !!dragNode
	const isDraggingMe = path === dragNode
	const addBeforePlaceholder = `${wrapperPath}["${index}"]` === dropNode
	const addAfterPlaceholder = `${wrapperPath}["${index + 1}"]` === dropNode

	const deepShadow =
		"0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)"
	const classes = styles.useUtilityStyles(
		{
			root: {
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

	const onDragOver = (e: DragEvent) => {
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		const currentTarget = e.currentTarget as HTMLDivElement
		const bounds = currentTarget.getBoundingClientRect()
		const dropIndex = isNextSlot(bounds, direction, e.pageX, e.pageY)
			? index + 1
			: index
		let usePath = `${wrapperPath}["${dropIndex}"]`

		if (usePath === component.path.getParentPath(dragNode)) {
			// Don't drop on ourselfs, just move to the next index
			usePath = `${wrapperPath}["${dropIndex + 1}"]`
		}

		if (usePath !== dropNode) {
			uesio.builder.setDropNode(usePath)
		}
	}

	const onDragStart = (e: DragEvent) => {
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

	const onDrop = (e: DragEvent) => {
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		const currentTarget = e.currentTarget as HTMLDivElement
		const bounds = currentTarget.getBoundingClientRect()
		const dropIndex = isNextSlot(bounds, direction, e.pageX, e.pageY)
			? index + 1
			: index

		handleDrop(
			dragNode,
			wrapperPath || "",
			getDropIndex(dragNode, wrapperPath || "", dropIndex),
			uesio
		)
	}
	return (
		<>
			{addBeforePlaceholder && <div className={classes.placeholder} />}
			<div
				onDragOver={onDragOver}
				onDrop={onDrop}
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
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
