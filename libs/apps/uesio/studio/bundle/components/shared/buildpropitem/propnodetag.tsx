import { FunctionComponent, useState } from "react"

import { component, context, styles } from "@uesio/ui"

const IOExpandPanel = component.registry.getUtility("uesio/io.expandpanel")

type Props = {
	title: string
	icon?: string
	iconColor?: string
	selected?: boolean
	onClick?: (e: MouseEvent) => void
	draggable?: string
	context: context.Context
	tooltip?: string
	expandChildren?: boolean
	popChildren?: boolean
}

const Tile = component.registry.getUtility("uesio/io.tile")
const Popper = component.registry.getUtility("uesio/io.popper")

const PropNodeTag: FunctionComponent<Props> = (props) => {
	const {
		title,
		onClick,
		children,
		draggable,
		selected,
		context,
		popChildren,
		expandChildren,
	} = props

	const [expanded, setExpanded] = useState<boolean>(false)
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
			title: {
				textTransform: "uppercase",
				overflow: "hidden",
				textOverflow: "ellipsis",
			},
		},
		props
	)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	return (
		<div
			className={classes.root}
			ref={setAnchorEl}
			draggable={!!draggable && !expanded}
			data-type={draggable}
		>
			<Tile
				variant="uesio/studio.propnodetag"
				//avatar={<Icon icon={icon} context={context} />}
				context={context}
				onClick={onClick}
				isSelected={selected}
			>
				<IOExpandPanel
					defaultExpanded={false}
					context={context}
					toggle={<div className={classes.title}>{title}</div>}
					showArrow={false}
					expandState={[expanded, setExpanded]}
				>
					{expandChildren && children}
				</IOExpandPanel>
			</Tile>
			{selected && popChildren && anchorEl && children && (
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
