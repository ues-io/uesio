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
}

const Icon = component.registry.getUtility("io.icon")
const Tile = component.registry.getUtility("io.tile")
const Popper = component.registry.getUtility("io.popper")

const PropNodeTag: FunctionComponent<Props> = (props) => {
	const {
		title,
		onClick,
		children,
		draggable,
		icon,
		iconColor,
		selected,
		context,
	} = props

	const classes = styles.useStyles(
		{
			popperPaper: {
				overflow: "hidden",
			},
		},
		props
	)
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	return (
		<div ref={setAnchorEl} draggable={!!draggable} data-type={draggable}>
			<Tile
				variant="io.tile.studio.propnodetag"
				avatar={<Icon icon={icon} context={context} />}
				context={context}
				onClick={onClick}
			>
				{title}
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
