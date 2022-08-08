import React, { FC, ReactNode, useState, useEffect } from "react"
import { component, context, styles } from "@uesio/ui"

type Props = {
	icon?: string
	iconColor?: string
	selected?: boolean
	onClick?: (e: MouseEvent) => void
	draggable?: string
	context: context.Context
	tooltip?: string
	panelAlwaysExpanded?: boolean
	expandChildren?: ReactNode
	popperChildren?: ReactNode
	useExpand?: (
		initialState?: boolean
	) => [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

const useExpand = (
	initialExpanded?: boolean,
	onExpand?: () => void,
	onClose?: () => void
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
	const [isExpanded, setIsExpanded] = useState(!!initialExpanded)

	useEffect(() => {
		if (isExpanded) onExpand && onExpand()
		if (isExpanded) onClose && onClose()
	}, [isExpanded])

	console.log({ isExpanded })
	return [isExpanded, setIsExpanded]
}

const Tile = component.getUtility("uesio/io.tile")
const Popper = component.getUtility("uesio/io.popper")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

const PropNodeTag: FC<Props> = (props) => {
	const { onClick, draggable, selected, context, popperChildren } = props
	const [isExpanded, setIsExpanded] =
		(props.useExpand && props.useExpand()) || useExpand()

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
	useEffect(() => {
		console.log({ ec: props.expandChildren })
	}, [props])
	return (
		<div
			className={classes.root}
			ref={setAnchorEl}
			draggable={!!draggable && !isExpanded}
			data-type={draggable}
			onClick={(e) => e.stopPropagation()}
		>
			<Tile
				variant="uesio/studio.propnodetag"
				context={context}
				onClick={onClick}
				isSelected={selected}
			>
				{props.expandChildren && (
					<IOExpandPanel
						context={context}
						toggle={
							<div className={classes.title}>
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
