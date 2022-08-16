import React, { FC, ReactNode, useState } from "react"
import { component, context, styles } from "@uesio/ui"

type Props = {
	selected?: boolean
	onClick?: (e: MouseEvent) => void
	draggable?: string
	context: context.Context
	tooltip?: string
	expandChildren?: ReactNode
	popperChildren?: ReactNode
	useExpand?: (
		initialState?: boolean
	) => [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

const Tile = component.getUtility("uesio/io.tile")
const Popper = component.getUtility("uesio/io.popper")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

const PropNodeTag: FC<Props> = (props) => {
	const { onClick, draggable, selected, context, popperChildren } = props
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [isExpanded, setIsExpanded] =
		(props.useExpand && props.useExpand()) || useState(false)

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
			inner: {
				overflow: "hidden",
				textOverflow: "ellipsis",
				padding: "8px",
			},
		},
		props
	)

	return (
		<div
			className={classes.root}
			ref={setAnchorEl}
			draggable={!!draggable && !isExpanded}
			data-type={draggable}
		>
			<Tile
				variant="uesio/studio.propnodetag"
				context={context}
				onClick={onClick}
				isSelected={selected}
			>
				{!props.expandChildren ? (
					<div className={classes.inner}>{props.children}</div>
				) : (
					<IOExpandPanel
						context={context}
						toggle={
							<div className={classes.inner}>
								{props.children}
							</div>
						}
						showArrow={true}
						expandState={[isExpanded, setIsExpanded]}
					>
						{props.expandChildren}
					</IOExpandPanel>
				)}
			</Tile>
			{selected && anchorEl && popperChildren && (
				<Popper
					referenceEl={anchorEl}
					context={context}
					placement="right"
				>
					{popperChildren}
				</Popper>
			)}
		</div>
	)
}

export default PropNodeTag
