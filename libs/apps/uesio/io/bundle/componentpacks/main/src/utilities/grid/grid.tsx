import { definition, styles } from "@uesio/ui"

interface GridProps {
	onClick?: () => void
}

const Grid: definition.UtilityComponent<GridProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props,
		"uesio/io.grid"
	)
	return (
		<div
			onClick={props.onClick}
			className={styles.cx("grid", classes.root, props.className)}
		>
			{props.children}
		</div>
	)
}

Grid.displayName = "GridUtility"

export default Grid
