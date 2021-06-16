import { definition, component, hooks, styles } from "@uesio/ui"
import { FunctionComponent, DragEvent } from "react"
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
		if (size === 0) {
			uesio.builder.setDropNode(`${path}["0"]`)
		}
	}

	const onDrop = (e: DragEvent) => {
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		const index = component.path.getIndexFromPath(dropNode) || 0
		handleDrop(dragNode, path, getDropIndex(dragNode, path, index), uesio)
	}

	const isDragging = !!dragNode

	const classes = styles.useStyles(
		{
			root: {
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

	return (
		<div onDragOver={onDragOver} onDrop={onDrop} className={classes.root}>
			{items.map((itemDef, index) => {
				const [
					componentType,
					unWrappedDef,
				] = component.path.unWrapDefinition(itemDef)
				return (
					<component.Component
						definition={unWrappedDef}
						componentType={componentType}
						index={index}
						path={`${path}["${index}"]`}
						context={context}
					/>
				)
			})}
		</div>
	)
}

export default SlotBuilder
