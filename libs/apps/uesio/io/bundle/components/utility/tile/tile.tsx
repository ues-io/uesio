import { FunctionComponent, ReactNode } from "react"
import { definition, styles } from "@uesio/ui"

interface TileUtilityProps extends definition.UtilityProps {
	avatar?: ReactNode
	onClick?: () => void
	isSelected: boolean
}

const Tile: FunctionComponent<TileUtilityProps> = (props) => {
	const { avatar, children, onClick, isSelected } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				...(onClick && {
					cursor: "pointer",
					// "&:hover": {
					// 	backdropFilter: "brightness(97%)",
					// },
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
			className={styles.cx(classes.root, isSelected && classes.selected)}
			onClick={onClick}
		>
			{avatar && <div className={classes.avatar}>{avatar}</div>}
			{children && <div className={classes.content}>{children}</div>}
		</div>
	)
}

export { TileUtilityProps }
export default Tile
