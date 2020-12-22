import { definition, component, hooks } from "@uesio/ui"
import React, { FunctionComponent } from "react"
import clsx from "clsx"
import { makeStyles, createStyles } from "@material-ui/core"
import SlotItem from "./slotitem"
import { handleDrop, getDropIndex, isDropAllowed } from "./dragdrop"

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
			"&$isDragging$expanded": {
				minHeight: "40px",
			},
		},
		vertical: {
			display: "block",
		},
		expanded: {
			padding: "8px",
		},
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
		definition: { items = [], accepts, direction },
		path,
		context,
	} = props
	const uesio = hooks.useUesio(props)

	const dragNode = uesio.builder.useDragNode()
	const dropNode = uesio.builder.useDropNode()
	const buildView = uesio.builder.useView()

	const isExpanded = buildView === "expandedview"

	const size = items?.length || 0

	// Temporary Hack
	if (direction === "manual") {
		return <component.SlotRuntime {...props} />
	}

	const onDragOver = (e: React.DragEvent) => {
		if (!isDropAllowed(accepts, dragNode)) {
			return
		}
		e.preventDefault()
		e.stopPropagation()
		if (path !== dropNode) {
			uesio.builder.setDropNode(path)
		}
	}

	const onDrop = (e: React.DragEvent) => {
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
			[classes.expanded]: isExpanded,
			[classes.isDragging]: dragNode,
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
					isExpanded={isExpanded}
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
