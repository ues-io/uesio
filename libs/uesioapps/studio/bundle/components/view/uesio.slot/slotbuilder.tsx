import { definition, component, hooks, styles } from "@uesio/ui"
import { FunctionComponent, DragEvent } from "react"
import {
	handleDrop,
	getDropIndex,
	isDropAllowed,
	isNextSlot,
} from "../../shared/dragdrop"

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
		let target = e.target as Element | null
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()

		while (
			target !== null &&
			target !== e.currentTarget &&
			target?.parentElement !== e.currentTarget
		) {
			target = target?.parentElement || null
		}

		const isCoverall = !!target?.getAttribute("data-coverall")
		// Find the direct child
		if (target === e.currentTarget || isCoverall) {
			if (size === 0) {
				uesio.builder.setDropNode(`${path}["0"]`)
			}
		}

		const dataIndex = target?.getAttribute("data-index")

		if (target?.parentElement === e.currentTarget && dataIndex) {
			const index = parseInt(dataIndex, 10)
			const bounds = target.getBoundingClientRect()
			const dropIndex = isNextSlot(
				bounds,
				direction || "vertical",
				e.pageX,
				e.pageY
			)
				? index + 1
				: index
			let usePath = `${path}["${dropIndex}"]`

			if (usePath === component.path.getParentPath(dragNode)) {
				// Don't drop on ourselfs, just move to the next index
				usePath = `${path}["${dropIndex + 1}"]`
			}

			if (usePath !== dropNode) {
				uesio.builder.setDropNode(usePath)
			}
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
			coverall: {
				...(size > 0 && {
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
				}),
				...(size === 0 &&
					isDropAllowed(accepts, dragNode) && {
						minWidth: "40px",
						minHeight: "40px",
					}),
				...(size === 0 &&
					dropNode === `${path}["0"]` && {
						border: "1px dashed #ccc",
						backgroundColor: "#e5e5e5",
					}),
			},
		},
		props
	)

	return (
		<div onDragOver={onDragOver} onDrop={onDrop} className={classes.root}>
			{isDragging && isStructureView && (
				<div className={classes.coverall} data-coverall="true" />
			)}
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
