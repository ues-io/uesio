import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"
import { handleDrop, isDropAllowed } from "../../shared/dragdrop"
import styling from "./styling"
interface BuildWrapperProps extends definition.UtilityProps {
	test?: string
}

const BuildWrapper: FunctionComponent<BuildWrapperProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { children, path = "", index = 0 } = props
	const [canDrag, setCanDrag] = useState(false)

	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const nodeState = uesio.builder.useNodeState("viewdef", viewDefId, path)
	const isActive = nodeState === "active"
	const isSelected = nodeState === "selected"
	const isStructureView = uesio.builder.useIsStructureView()
	const isContentView = !isStructureView
	const showHeader = isStructureView || (isContentView && isSelected)
	const propDef = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath("viewdef", viewDefId, path)
	)
	const accepts = propDef?.accepts

	const Drag = (() => {
		const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
		const fullDragPath = component.path.makeFullPath(
			dragType,
			dragItem,
			dragPath
		)
		const [dropType, dropItem, dropPath] = uesio.builder.useDropNode()

		return {
			fullDragPath,
			dropNode: {
				path: dropPath,
			},
			dragNode: {
				path: dragPath,
			},
			isDragging:
				path === dragPath &&
				dragType === "viewdef" &&
				dragItem === viewDefId,
			start: (e: DragEvent) => {
				e.stopPropagation()
				setTimeout(() => {
					if (dragPath !== path) {
						uesio.builder.setDragNode("viewdef", viewDefId, path)
					}
				})
			},
			end: () => {
				uesio.builder.clearDragNode()
				uesio.builder.clearDropNode()
			},
			over: (e: DragEvent) => {
				if (!accepts) return
				if (!isDropAllowed(accepts, fullDragPath)) {
					return
				}
				e.preventDefault()
				e.stopPropagation()
				uesio.builder.setDropNode("viewdef", viewDefId, path)
			},
			drop: (e: DragEvent) => {
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
			},
		}
	})()

	const wrapperPath = component.path.getGrandParentPath(path)
	const addBeforePlaceholder =
		`${wrapperPath}["${index}"]` === Drag.dropNode.path
	const addAfterPlaceholder =
		`${wrapperPath}["${index + 1}"]` === Drag.dropNode.path
	const classes = styling(
		props,
		styles,
		isSelected,
		isActive,
		isStructureView,
		isContentView,
		Drag.isDragging
	)
	return (
		<>
			{addBeforePlaceholder && <div className={classes.placeholder} />}
			<div
				data-index={index}
				onDragStart={Drag.start}
				onDragEnd={Drag.end}
				onDragOver={Drag.over}
				onDrop={Drag.drop}
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
						onMouseDown={() => isStructureView && setCanDrag(true)}
						onMouseUp={() =>
							isStructureView &&
							Drag.dragNode.path &&
							setCanDrag(false)
						}
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
