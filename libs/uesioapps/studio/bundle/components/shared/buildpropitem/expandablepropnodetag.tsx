import React, { FC, useState, useRef } from "react"
import { component, context, styles } from "@uesio/ui"

type Props = {
	title: string
	icon?: string
	iconColor?: string
	onClick?: () => void
	draggable?: string
	context: context.Context
	tooltip?: string
}

const Icon = component.registry.getUtility("io.icon")
const Tile = component.registry.getUtility("io.tile")
const IconButton = component.registry.getUtility("io.iconbutton")

const ExpandablePropNodeTag: FC<Props> = (props) => {
	const { title, onClick, draggable, icon, context } = props
	const children = props.children as React.ReactNode[]
	const expandBox = useRef<HTMLDivElement>(null)
	const [expanded, setExpanded] = useState(false)
	const classes = styles.useStyles(
		{
			root: {
				cursor: draggable ? "grab" : "inherit",
				"&:hover .icon": {
					opacity: 0.3,
				},
				border: "1px solid #eee",
				borderRadius: "4px",
				marginBottom: "4px",
				".icon": {
					cursor: "initial",
					opacity: 0,
					transition: "opacity 0.125s ease, transform 0.3s ease",
					"&:hover": {
						opacity: 1,
					},
					transform: `rotate(${expanded ? "18" : ""}0deg)`,
				},
			},
			title: {
				textTransform: "uppercase",
			},

			badgeContainer: {
				display: "flex",
				padding: "0 8px",
				opacity: expanded ? "1" : "0",
				flexFlow: "row wrap",
				maxHeight: expanded ? "300px" : "0px",
				transition: "opacity 0.125s ease, max-height 0.3s ease",
			},
		},
		props
	)
	const expandable = children && children.length > 0

	const triggerState = () => {
		setExpanded(!expanded)
		onClick && onClick()
	}

	return (
		<div
			className={classes.root}
			draggable={!expanded && !!draggable}
			data-type={!expanded && draggable}
		>
			<Tile
				variant="io.tile.studio.expandablepropnodetag"
				avatar={
					<Icon
						icon={expanded && expandable ? "invert_colors" : icon}
						context={context}
					/>
				}
				context={context}
				onClick={triggerState}
			>
				<span className={classes.title}>{title}</span>
				{expandable && (
					<IconButton
						size="small"
						icon="expand_more"
						label={"Expand"}
						className="icon"
						context={context}
					/>
				)}
			</Tile>

			<div ref={expandBox} className={classes.badgeContainer}>
				{expanded && children}
			</div>
		</div>
	)
}

export default ExpandablePropNodeTag
