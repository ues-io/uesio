import React, { FC, useState, useEffect, useRef } from "react"
import { component, context, styles } from "@uesio/ui"

type Props = {
	title: string
	icon?: string
	iconColor?: string
	selected?: boolean
	onClick?: () => void
	draggable?: string
	context: context.Context
	tooltip?: string
	// children: React.ReactNode[]
}

const Icon = component.registry.getUtility("io.icon")
const Tile = component.registry.getUtility("io.tile")
const IconButton = component.registry.getUtility("io.iconbutton")

const ExpandablePropNodeTag: FC<Props> = (props) => {
	const {
		title,
		onClick,
		draggable,
		icon,
		iconColor,
		tooltip,
		selected,
		context,
	} = props
	const children = props.children as React.ReactNode[]
	const expandBox = useRef<HTMLDivElement>(null)
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
					transform: `rotate(${selected ? "18" : ""}0deg)`,
				},
			},
			title: {
				textTransform: "uppercase",
			},

			badgeContainer: {
				display: "flex",
				padding: "0 8px",
				opacity: selected ? "1" : "0",
				flexFlow: "row wrap",
				maxHeight: selected ? "300px" : "0px",
				transition: "opacity 0.125s ease, max-height 0.3s ease",
			},
		},
		props
	)

	const expandable = children && children.length > 0
	return (
		<div
			className={classes.root}
			draggable={!selected && !!draggable}
			data-type={draggable}
		>
			<Tile
				variant="io.tile.studio.expandablepropnodetag"
				avatar={
					<Icon
						icon={selected && expandable ? "invert_colors" : icon}
						context={context}
					/>
				}
				context={context}
				onClick={onClick}
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
				{selected && expandable && children}
			</div>
		</div>
	)
}

export default ExpandablePropNodeTag
