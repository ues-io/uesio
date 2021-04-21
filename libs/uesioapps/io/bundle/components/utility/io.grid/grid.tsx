import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

const Grid: FunctionComponent<definition.UtilityProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				display: "grid",
			},
		},
		props
	)
	return (
		<div
			className={styles.cx(
				classes.root,
				props.className as string | undefined
			)}
		>
			{props.children}
		</div>
	)
}

export default Grid
