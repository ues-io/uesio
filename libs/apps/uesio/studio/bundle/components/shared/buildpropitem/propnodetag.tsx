import React, { useEffect, FC, useState, ReactNode } from "react"

import { component, context, styles } from "@uesio/ui"

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
	panelAlwaysExpanded?: boolean
	panelChildren?: ReactNode
	popperChildren?: ReactNode
}

const Tile = component.getUtility("uesio/io.tile")
const Popper = component.getUtility("uesio/io.popper")
const Icon = component.getUtility("uesio/io.icon")
const Button = component.getUtility("uesio/io.button")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

const PropNodeTag: FC<Props> = React.memo((props) => {
	const {
		title,
		onClick,
		draggable,
		selected,
		context,
		panelAlwaysExpanded,
		panelChildren,
		popperChildren,
	} = props

	const [expanded, setExpanded] = useState<boolean>()
	// const [expanded, setExpanded] = useState<boolean>(
	// 	panelAlwaysExpanded ? panelAlwaysExpanded : false
	// )
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
				padding: "8px",
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
			onClick={(e) => e.stopPropagation()}
		>
			<Tile
				variant="uesio/studio.propnodetag"
				context={context}
				onClick={onClick}
				isSelected={selected}
			>
				<IOExpandPanel
					defaultExpanded={false}
					context={context}
					toggle={
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
							}}
						>
							<div className={classes.title}>{title}</div>
							{expandChildren && children && (
								<Button
									context={context}
									icon={
										<div style={{ padding: "8px" }}>
											<Icon
												context={context}
												icon={`expand_${
													expanded ? "less" : "more"
												}`}
											/>
										</div>
									}
									onClick={(e) => {
										e.stopPropagation()
										setExpanded(!expanded)
									}}
								>
									toggle
								</Button>
							)}
						</div>
					}
					showArrow={false}
					expandState={
						panelAlwaysExpanded
							? [true, null]
							: [expanded, setExpanded]
					}
				>
					{panelChildren}
				</IOExpandPanel>
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
})

export default PropNodeTag
