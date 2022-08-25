import { FC, ReactNode, useState } from "react"
import { component, context } from "@uesio/ui"

type Props = {
	selected?: boolean
	onClick?: (e: MouseEvent) => void
	draggable?: string
	context: context.Context
	expandChildren?: ReactNode
	popperChildren?: ReactNode
	variant?: string
}

const Tile = component.getUtility("uesio/io.tile")
const Popper = component.getUtility("uesio/io.popper")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

const PropNodeTag: FC<Props> = (props) => {
	const { onClick, draggable, selected, context, popperChildren, variant } =
		props
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
	const [isExpanded, setIsExpanded] = useState(false)

	return (
		<Tile
			ref={setAnchorEl}
			rootAttributes={{
				draggable: !!draggable && !isExpanded,
				"data-type": draggable,
			}}
			variant={variant || "uesio/studio.propnodetag"}
			context={context}
			onClick={onClick}
			isSelected={selected}
		>
			{selected && popperChildren && (
				<Popper
					referenceEl={anchorEl}
					context={context}
					placement="right"
				>
					{popperChildren}
				</Popper>
			)}
			{!props.expandChildren ? (
				props.children
			) : (
				<IOExpandPanel
					context={context}
					toggle={props.children}
					showArrow={true}
					expandState={[isExpanded, setIsExpanded]}
				>
					{props.expandChildren}
				</IOExpandPanel>
			)}
		</Tile>
	)
}

PropNodeTag.displayName = "PropNodeTag"

export default PropNodeTag
