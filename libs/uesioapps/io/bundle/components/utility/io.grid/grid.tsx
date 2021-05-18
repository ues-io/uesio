import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

const Grid: FunctionComponent<definition.UtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "grid",
			},
		},
		props
	)
	return <div className={classes.root}>{props.children}</div>
}

export default Grid
