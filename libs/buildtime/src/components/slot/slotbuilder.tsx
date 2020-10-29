import { definition, component, hooks } from "@uesio/ui"
import React, { ReactElement, Fragment } from "react"
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
				marginTop: "0",
				marginLeft: "0",
			},
		},
		placeHolderNoMargin: {},
	})
)

function SlotBuilder(props: SlotProps): ReactElement | null {
	const { definition, path, context } = props
	const items = definition.items as definition.DefinitionList
	const accepts = definition.accepts
	const direction =
		definition.direction === "horizontal" ? "horizontal" : "vertical"

	const uesio = hooks.useUesio(props)

	const dragNode = uesio.builder.useDragNode()
	const dropNode = uesio.builder.useDropNode()
	const buildView = uesio.builder.useView()

	const isExpanded = buildView === "expandedview"

	const size = items?.length || 0

	// Temporary Hack
	if (definition.direction === "manual") {
		const items = definition.items as definition.DefinitionList
		const listPath = path
		return (
			<Fragment>
				{items
					? items.map((itemDef, index) => {
							const itemPath = `${listPath}["${index}"]`
							return component.create(
								itemDef,
								index,
								itemPath,
								context
							)
					  })
					: []}
			</Fragment>
		)
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

	const classNames = [classes.root]

	if (isExpanded) {
		classNames.push(classes.expanded)
	}

	if (dragNode) {
		classNames.push(classes.isDragging)
	}

	classNames.push(
		direction === "horizontal" ? classes.horizontal : classes.vertical
	)

	const addPlaceholder =
		dropNode === path || dropNode === `${path}["${size}"]`

	const placeHolderClasses = [classes.placeHolder]

	if (
		addPlaceholder &&
		component.path.getParentPath(dragNode) === `${path}["${size - 1}"]`
	) {
		placeHolderClasses.push(classes.placeHolderNoMargin)
	}

	return (
		<div
			onDragOver={onDragOver}
			onDrop={onDrop}
			className={classNames.join(" ")}
		>
			{items?.map((itemDef, index) => {
				return (
					<SlotItem
						key={index}
						{...{
							path,
							index,
							definition: itemDef,
							isExpanded,
							direction,
							size,
							componentType: "",
							context: context,
							accepts,
							dragNode,
							dropNode,
						}}
					/>
				)
			})}
			{addPlaceholder && <div className={placeHolderClasses.join(" ")} />}
		</div>
	)
}

export default SlotBuilder
