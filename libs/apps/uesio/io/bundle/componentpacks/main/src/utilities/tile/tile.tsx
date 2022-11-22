import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TileUtilityProps extends definition.UtilityProps {
	avatar?: ReactNode
	onClick?: () => void
	isSelected: boolean
	rootAttributes?: HTMLAttributes<HTMLDivElement>
}

const Tile = forwardRef<HTMLDivElement, TileUtilityProps>((props, ref) => {
	const { avatar, children, onClick, isSelected, rootAttributes } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				...(onClick && {
					cursor: "pointer",
				}),
			},
			content: {
				flex: 1,
			},
			avatar: {},
			selected: {},
		},
		props
	)

	return (
		<div
			{...rootAttributes}
			ref={ref}
			className={styles.cx(classes.root, isSelected && classes.selected)}
			onClick={onClick}
		>
			{avatar && <div className={classes.avatar}>{avatar}</div>}
			{children && <div className={classes.content}>{children}</div>}
		</div>
	)
})

export { TileUtilityProps }
export default Tile
