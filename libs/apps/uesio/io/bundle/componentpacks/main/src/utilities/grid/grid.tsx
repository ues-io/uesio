import { definition, styles } from "@uesio/ui"

interface GridProps {
	onClick?: () => void
}

const Grid: definition.UtilityComponent<GridProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props
	)
	return (
		<div
			onClick={props.onClick}
			className={styles.cx("grid", classes.root)}
		>
			{props.children}
		</div>
	)
}

Grid.displayName = "GridUtility"

export default Grid
