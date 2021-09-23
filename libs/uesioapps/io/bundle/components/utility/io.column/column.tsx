import { FC } from "react"
import { definition, styles } from "@uesio/ui"

const Column: FC<definition.UtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props
	)
	return <div className={classes.root}>{props.children}</div>
}

export default Column
