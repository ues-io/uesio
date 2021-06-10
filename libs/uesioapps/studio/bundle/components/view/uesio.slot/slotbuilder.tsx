import { definition, component, hooks, styles } from "@uesio/ui"
import { FunctionComponent, DragEvent } from "react"
import SlotItem from "../../shared/slotitem"
import { handleDrop, getDropIndex, isDropAllowed } from "../../shared/dragdrop"

type SlotDefinition = {
	items: definition.DefinitionList
	accepts: string[]
	direction?: string
}

interface SlotProps extends definition.BaseProps {
	definition: SlotDefinition
}

const SlotBuilder: FunctionComponent<SlotProps> = (props) => {
	const {
		definition: { accepts, direction },
		path,
		context,
	} = props

	const items = props.definition.items || []

	const uesio = hooks.useUesio(props)

	const dragNode = uesio.builder.useDragNode()
	const dropNode = uesio.builder.useDropNode()
	const isStructureView = uesio.builder.useIsStructureView()
	const isContentView = !isStructureView
	const isHorizontal = direction === "horizontal"
	const isVertical = !isHorizontal

	const size = items.length

	// Temporary Hack
	if (direction === "manual") {
		return <component.SlotRuntime {...props} />
	}

	if (!path) return null

	const onDragOver = (e: DragEvent) => {
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		if (path !== dropNode) {
			uesio.builder.setDropNode(path)
		}
	}

	const onDrop = (e: DragEvent) => {
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		handleDrop(dragNode, path, getDropIndex(dragNode, path, size), uesio)
	}

	const isDragging = !!dragNode

	const classes = styles.useStyles(
		{
			root: {
				height: "100%",
				...(isHorizontal && {
					display: "flex",
					alignItems: "center",
					...(isDragging &&
						isStructureView && {
							minHeight: "40px",
						}),
				}),
				display: "contents",
			},
			placeHolder: {
				backgroundColor: "#f4f4f4",
				border: "1px solid #EEE",
				...(isHorizontal && {
					paddingLeft: "120px",
					marginLeft: "8px",
					alignSelf: "stretch",
				}),
				...(isVertical && {
					paddingTop: "40px",
					marginTop: "8px",
				}),
			},
			placeHolderNoMargin: {
				marginTop: 0,
				marginLeft: 0,
			},
		},
		props
	)

	const addPlaceholder =
		dropNode === path || dropNode === `${path}["${size}"]`

	const placeholderClasses = styles.cx(classes.placeHolder, {
		[classes.placeHolderNoMargin]:
			addPlaceholder &&
			component.path.getParentPath(dragNode) === `${path}["${size - 1}"]`,
	})
	return (
		<div onDragOver={onDragOver} onDrop={onDrop} className={classes.root}>
			{items.map((itemDef, index) => (
				<SlotItem
					key={index}
					path={path}
					index={index}
					definition={itemDef}
					direction={
						direction === "horizontal" ? "horizontal" : "vertical"
					}
					size={size}
					context={context}
					accepts={accepts}
					dragNode={dragNode}
					dropNode={dropNode}
				/>
			))}
			{addPlaceholder && <div className={placeholderClasses} />}
		</div>
	)
}

export default SlotBuilder
