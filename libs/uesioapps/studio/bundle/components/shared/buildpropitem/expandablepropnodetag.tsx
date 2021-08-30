import { FunctionComponent, useState } from "react"

import { component, context, styles, hooks } from "@uesio/ui"

type Props = {
	title: string
	icon?: string
	iconColor?: string
	selected?: boolean
	onClick?: () => void
	draggable?: string
	context: context.Context
	tooltip?: string
}

const Icon = component.registry.getUtility("io.icon")
const Tile = component.registry.getUtility("io.tile")
const IconButton = component.registry.getUtility("io.iconbutton")

const onClickHandler = (): void => {
	alert("WORKS")
}

const ExpandablePropNodeTag: FunctionComponent<Props> = (props) => {
	const {
		title,
		onClick,
		children,
		draggable,
		icon,
		iconColor,
		tooltip,
		selected,
		context,
	} = props

	const classes = styles.useStyles(
		{
			root: {
				cursor: draggable ? "grab" : "inherit",
				"&:hover .tooltip": {
					opacity: 0.3,
				},
				border: "1px solid #eee",
				borderRadius: "4px",
				".tooltip": {
					cursor: "initial",
					opacity: 0,
					textTransform: "initial",
					transition: "opacity 0.125s ease",
					"&:hover": {
						opacity: 1,
					},
				},
			},
			title: {
				textTransform: "uppercase",
			},
		},
		props
	)

	const [expanded, setExpanded] = useState(false)

	const triggerState = () => {
		!expanded ? setExpanded(true) : setExpanded(false)
	}

	return (
		<div
			className={classes.root}
			draggable={!expanded && !!draggable}
			data-type={draggable}
		>
			<Tile
				variant="io.tile.studio.expandablepropnodetag"
				avatar={<Icon icon={icon} context={context} />}
				context={context}
				onClick={onClick}
			>
				<span className={classes.title}>{title}</span>
				<IconButton
					size="small"
					icon="expand"
					label={"Expand"}
					className="tooltip"
					context={context}
					onClick={triggerState}
				/>
			</Tile>
			{expanded && children && <div> {children} </div>}
		</div>
	)
}

export default ExpandablePropNodeTag
