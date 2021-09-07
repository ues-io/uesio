import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface GridProps extends definition.UtilityProps {
	onClick?: () => void
}

const Grid: FunctionComponent<GridProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "grid",
			},
		},
		props
	)
	return (
		<div onClick={props.onClick} className={classes.root}>
			{props.children}
		</div>
	)
}

export default Grid
