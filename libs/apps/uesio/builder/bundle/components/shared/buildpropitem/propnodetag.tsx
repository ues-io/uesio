import { FC, ReactNode, useState } from "react"
import { component, context, styles } from "@uesio/ui"

type Props = {
	selected?: boolean
	onClick?: (e: MouseEvent) => void
	draggable?: string
	context: context.Context
	popperChildren?: ReactNode
	variant?: string
}

const Tile = component.getUtility("uesio/io.tile")
const Popper = component.getUtility("uesio/io.popper")

const PropNodeTag: FC<Props> = (props) => {
	const { onClick, draggable, selected, context, popperChildren, variant } =
		props
	const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

	return (
		<Tile
			ref={setAnchorEl}
			rootAttributes={{
				draggable: !!draggable,
				"data-type": draggable,
			}}
			variant={variant || "uesio/studio.propnodetag"}
			context={context}
			onClick={onClick}
			isSelected={selected}
			className={styles.cx(selected && "selected")}
		>
			{selected && popperChildren && (
				<Popper
					referenceEl={anchorEl}
					context={context}
					placement="right-start"
					useFirstRelativeParent
				>
					{popperChildren}
				</Popper>
			)}
			{props.children}
		</Tile>
	)
}

PropNodeTag.displayName = "PropNodeTag"

export default PropNodeTag
