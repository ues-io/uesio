import { definition, component, hooks, styles } from "@uesio/ui"
import { FunctionComponent, SyntheticEvent, DragEvent } from "react"
import BuildBorder from "./buildborder"
import { handleDrop, getDropIndex, isDropAllowed, isNextSlot } from "./dragdrop"

interface SlotItemProps extends definition.BaseProps {
	direction: string
	size: number
	accepts: string[]
	dragNode: string
	dropNode: string
}

const SlotItem: FunctionComponent<SlotItemProps> = (props) => {
	const {
		path: wrapperPath,
		context,
		direction,
		dropNode,
		accepts,
		dragNode,
		definition,
		size = 0,
		index = 0,
	} = props

	const uesio = hooks.useUesio(props)
	const path = `${wrapperPath}["${index}"]`
	const isStructureView = uesio.builder.useIsStructureView()
	const isContentView = !isStructureView
	const isHorizontal = direction === "horizontal"
	const isVertical = !isHorizontal
	const isLast = index === size - 1
	const isDragging = !!dragNode
	const addPlaceholder = path === dropNode
	const classes = styles.useStyles(
		{
			root: {
				userSelect: "none",
				position: "relative",
				transition: "max-height 0.2s ease, max-width 0.2s ease",
				...(isHorizontal && {
					display: "flex",
					width: "unset",
					...(isStructureView && {
						padding: "0 8px 0 0",
					}),
					...(isLast && {
						padding: 0,
					}),
				}),
				...(isVertical && {
					display: "block",
					width: "100%",
					...(isStructureView && {
						padding: "0 0 8px 0",
					}),
					...(isLast && {
						padding: 0,
					}),
					...(isContentView && {
						display: "contents",
					}),
				}),
				...(isDragging && {
					"&:before": {
						...(isVertical && {
							display: "block",
						}),
						...(isHorizontal && {
							display: "flex",
							width: 0,
							alignSelf: "stretch",
						}),
						content: "''",
						transition: "padding 0.2s ease",
						...(addPlaceholder && {
							...(isVertical && {
								paddingTop: "40px",
								marginBottom: "8px",
							}),
							...(isHorizontal && {
								paddingLeft: "120px",
								marginRight: "8px",
							}),
							backgroundColor: "#f4f4f4",
							border: "1px solid #EEE",
						}),
					},
					maxHeight: "100%",
					maxWidth: "100%",
				}),
			},
		},
		props
	)

	const [componentType, unWrappedDef] = component.path.unWrapDefinition(
		definition as definition.DefinitionMap
	)
	const fullPath = `${path}["${componentType}"]`

	const nodeState = uesio.builder.useNodeState(fullPath)
	const isActive = nodeState === "active"
	const isSelected = nodeState === "selected"

	const propDef = component.registry.getPropertiesDefinitionFromPath(fullPath)

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
		const target = e.target as HTMLDivElement
		setTimeout(() => {
			target.style.visibility = "hidden"
			target.style.maxHeight = "0px"
			target.style.maxWidth = "0px"
			target.style.padding = "0px"
			target.style.margin = "0px"
		}, 1)
	}

	const onDragEnd = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		target.style.removeProperty("visibility")
		target.style.removeProperty("max-height")
		target.style.removeProperty("max-width")
		target.style.removeProperty("padding")
		target.style.removeProperty("margin")
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
		const halfWay = bounds.y + bounds.height / 2
		const dropIndex = e.pageY < halfWay ? index : index + 1

		handleDrop(
			dragNode,
			wrapperPath || "",
			getDropIndex(dragNode, wrapperPath || "", dropIndex),
			uesio
		)
	}

	return (
		<div
			onDragOver={onDragOver}
			onDrop={onDrop}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			className={classes.root}
			draggable={dragNode === fullPath}
		>
			<BuildBorder
				isStructureView={isStructureView}
				isActive={isActive}
				isSelected={isSelected}
				onClick={(event: SyntheticEvent) => {
					!isSelected && uesio.builder.setSelectedNode(fullPath)
					event.stopPropagation()
				}}
				onMouseEnter={() => {
					!isActive && uesio.builder.setActiveNode(fullPath)
				}}
				onMouseLeave={() => {
					isActive && uesio.builder.setActiveNode("")
				}}
				setDragging={() => {
					if (!isStructureView) {
						return
					}
					// TODO: Do some kind of check here to ensure we aren't dragging the last button
					// in a button set or the last field in a table, etc.
					// Or modify them to not have 0 height when empty of fields/buttons
					if (dragNode !== fullPath) {
						uesio.builder.setDragNode(fullPath)
					}
				}}
				title={propDef?.title ?? "Unknown"}
			>
				<component.Component
					definition={unWrappedDef}
					componentType={componentType}
					index={index}
					path={path}
					context={context}
				/>
			</BuildBorder>
		</div>
	)
}

export default SlotItem
