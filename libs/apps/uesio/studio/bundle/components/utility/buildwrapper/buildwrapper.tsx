import { FunctionComponent, SyntheticEvent, DragEvent, useState } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"
import styling from "./styling"

const BuildWrapper: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { children, path = "", index = 0, definition } = props
	const [canDrag, setCanDrag] = useState(false)

	const viewDefId = uesio.getViewDefId()

	const wireId = definition?.wire || ""

	if (!viewDefId) return null

	const nodeState = uesio.builder.useNodeState("viewdef", viewDefId, path)
	const isActive = nodeState === "active"
	const isSelected = nodeState === "selected"
	const [propDef] = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath("viewdef", viewDefId, path)
	)
	const accepts = propDef?.accepts

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const [, , dropPath] = uesio.builder.useDropNode()
	const isDragging =
		path === dragPath && dragType === "viewdef" && dragItem === viewDefId

	const wrapperPath = component.path.getGrandParentPath(path)
	const componentKey = component.path.getKeyAtPath(path)

	const title =
		componentKey === "uesio/core.view"
			? definition?.view
			: propDef?.title || "unknown"

	const addBeforePlaceholder = `${wrapperPath}["${index}"]` === dropPath
	const addAfterPlaceholder = `${wrapperPath}["${index + 1}"]` === dropPath
	const classes = styles.useUtilityStyles(
		styling(isSelected, isActive, isDragging),
		props
	)
	return (
		<>
			{addBeforePlaceholder && (
				<div
					data-placeholder="true"
					data-index={index}
					className={classes.placeholder}
				/>
			)}
			<div
				data-index={index}
				data-accepts={accepts?.join(",")}
				data-path={path}
				onDragStart={(e: DragEvent) => {
					// We do this because we don't want
					// this component to always be draggable
					// that's why we do the setCanDrag thing
					e.stopPropagation()
					setTimeout(() => {
						if (dragPath !== path) {
							uesio.builder.setDragNode(
								"viewdef",
								viewDefId,
								path
							)
						}
					})
				}}
				onDragEnd={() => {
					uesio.builder.clearDragNode()
					uesio.builder.clearDropNode()
				}}
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
				{
					<div
						className={classes.header}
						onMouseDown={() => setCanDrag(true)}
						onMouseUp={() => dragPath && setCanDrag(false)}
					>
						{title}

						{wireId && (
							<div className={classes.wireIndicator}>
								<span className="dottie" />
								<span className="wireDash">&mdash;</span>
								<span
									className="wireName"
									onClick={(e) => {
										e.stopPropagation()
										uesio.builder.setSelectedNode(
											"viewdef",
											uesio.getViewDefId() || "",
											`["wires"]["${wireId}"]`
										)
									}}
								>
									<span title={"Edit wire"} role="button">
										{wireId}
									</span>
								</span>
							</div>
						)}
					</div>
				}
				<div className={classes.inner}>{children}</div>
			</div>
			{addAfterPlaceholder && (
				<div
					data-placeholder="true"
					data-index={index + 1}
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
