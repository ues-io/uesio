import { FC, ReactNode, useState } from "react"
import { component, styles, definition } from "@uesio/ui"

type Props = {
	selected?: boolean
	onClick?: (e: MouseEvent) => void
	draggable?: string
	popperChildren?: ReactNode
} & definition.UtilityProps

const PropNodeTag: FC<Props> = (props) => {
	const Tile = component.getUtility("uesio/io.tile")
	const Popper = component.getUtility("uesio/io.popper")
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
			variant={variant || "uesio/builder.propnodetag"}
			context={context}
			onClick={onClick}
			isSelected={selected}
			className={styles.cx(selected && "selected")}
		>
			{selected && popperChildren && (
				<Popper
					referenceEl={anchorEl}
					matchHeight
					offset={6}
					context={context}
					placement="right-start"
					autoPlacement={["right-start"]}
					useFirstRelativeParent
					styles={{
						popper: {
							width: "350px",
						},
					}}
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
