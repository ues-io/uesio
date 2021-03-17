import { definition, component, hooks } from "@uesio/ui"
import { FunctionComponent, DragEvent } from "react"
import clsx from "clsx"
import { makeStyles, createStyles } from "@material-ui/core"
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

const useStyles = makeStyles((theme) =>
	createStyles({
		root: {
			"& > .adder": {
				display: "none",
			},
			"&:hover > .adder": {
				display: "inline-block",
				margin: theme.spacing(1),
				padding: "2px 8px",
			},
			height: "100%",
		},
		horizontal: {
			display: "flex",
			alignItems: "center",
			"&$isDragging$structureView": {
				minHeight: "40px",
			},
		},
		vertical: {
			display: "block",
			"&$contentView": {
				display: "contents",
			},
		},
		structureView: {
			padding: "8px",
		},
		contentView: {},
		isDragging: {},
		placeHolder: {
			backgroundColor: "#f4f4f4",
			border: "1px solid #EEE",
			"$vertical > &": {
				paddingTop: "40px",
				marginTop: "8px",
			},
			"$horizontal > &": {
				paddingLeft: "120px",
				marginLeft: "8px",
				alignSelf: "stretch",
			},
			"&$placeHolderNoMargin": {
				marginTop: 0,
				marginLeft: 0,
			},
		},
		placeHolderNoMargin: {},
	})
)

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

	const classes = useStyles()
	const containerClasses = clsx(
		classes.root,
		direction === "horizontal" ? classes.horizontal : classes.vertical,
		{
			[classes.structureView]: isStructureView,
			[classes.isDragging]: dragNode,
			[classes.contentView]: !isStructureView,
		}
	)

	const addPlaceholder =
		dropNode === path || dropNode === `${path}["${size}"]`

	const placeholderClasses = clsx(classes.placeHolder, {
		[classes.placeHolderNoMargin]:
			addPlaceholder &&
			component.path.getParentPath(dragNode) === `${path}["${size - 1}"]`,
	})
	return (
		<div
			onDragOver={onDragOver}
			onDrop={onDrop}
			className={containerClasses}
		>
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
