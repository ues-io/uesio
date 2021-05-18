import { FunctionComponent, useRef } from "react"
import { Popper, Paper } from "@material-ui/core"

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
			popper: {
				marginLeft: "16px",
				width: "239px",
			},
			popperPaper: {
				overflow: "hidden",
			},
		},
		props
	)
	const ref = useRef<HTMLDivElement | null>(null)
	return (
		<div ref={ref} draggable={!!draggable} data-type={draggable}>
			<Tile
				variant="io.tile.studio.propnodetag"
				avatar={<Icon icon={icon} context={context} />}
				context={context}
				onClick={onClick}
			>
				{title}
			</Tile>
			{selected && ref.current && children && (
				<Popper
					className={classes.popper}
					anchorEl={ref.current}
					open={true}
					placement="right"
				>
					<Paper className={classes.popperPaper}>{children}</Paper>
				</Popper>
			)}
		</div>
	)
}

export default PropNodeTag
