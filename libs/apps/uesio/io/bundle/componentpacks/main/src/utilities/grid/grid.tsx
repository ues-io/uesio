import { definition, styles } from "@uesio/ui"

interface GridProps {
	onClick?: () => void
}

const Grid: definition.UtilityComponent<GridProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(
		{
			root: ["grid"],
		},
		props,
		"uesio/io.grid"
	)
	return (
		<div onClick={props.onClick} className={classes.root}>
			{props.children}
		</div>
	)
}

Grid.displayName = "GridUtility"

export default Grid
