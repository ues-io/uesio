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
		},
		props
	)

	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	return (
		<div
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
			>
				<span>{title}</span>
				{/* We might want to make a renderprop for the tooltip */}
				{tooltip && (
					<span className="tooltip">
						<IconButton
							size="small"
							icon="help"
							label={tooltip}
							context={context}
						/>
					</span>
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
