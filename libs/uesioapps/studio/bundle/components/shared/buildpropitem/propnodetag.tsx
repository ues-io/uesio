import { FunctionComponent, useState } from "react"

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
	style?: { [key: string]: string }
}

const Icon = component.registry.getUtility("io.icon")
const Tile = component.registry.getUtility("io.tile")
const Popper = component.registry.getUtility("io.popper")
const IconButton = component.registry.getUtility("io.iconbutton")

const PropNodeTag: FunctionComponent<Props> = (props) => {
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
		style,
	} = props

	const classes = styles.useStyles(
		{
			root: {
				cursor: draggable ? "grab" : "inherit",
				"&:hover .tooltip": {
					opacity: 0.3,
				},

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
			popperPaper: {
				overflow: "hidden",
			},
			tile: {
				border: selected
					? `1px solid ${
							context.getTheme().definition.palette.primary
					  }`
					: "1px solid auto",
			},
			title: {
				textTransform: "uppercase",
			},
		},
		props
	)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	return (
		<div
			style={style}
			className={classes.root}
			ref={setAnchorEl}
			draggable={!!draggable}
			data-type={draggable}
		>
			<Tile
				variant="io.tile.studio.propnodetag"
				avatar={<Icon icon={icon} context={context} />}
				context={context}
				onClick={onClick}
				className={classes.tile}
			>
				<span className={classes.title}>{title}</span>

				{tooltip && (
					<IconButton
						size="small"
						icon="help"
						label={tooltip}
						className="tooltip"
						context={context}
					/>
				)}
			</Tile>
			{selected && anchorEl && children && (
				<Popper
					referenceEl={anchorEl}
					context={context}
					placement="right"
				>
					{children}
				</Popper>
			)}
		</div>
	)
}

export default PropNodeTag
