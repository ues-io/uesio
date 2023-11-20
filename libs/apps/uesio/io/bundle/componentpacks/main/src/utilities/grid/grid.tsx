import { definition, styles } from "@uesio/ui"

interface GridProps {
	onClick?: () => void
}

const StyleDefaults = Object.freeze({
	root: ["grid"],
})

const Grid: definition.UtilityComponent<GridProps> = (props) => {
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.grid"
	)
	return (
		<div onClick={props.onClick} className={classes.root} id={props.id}>
			{props.children}
		</div>
	)
}

Grid.displayName = "GridUtility"

export default Grid
