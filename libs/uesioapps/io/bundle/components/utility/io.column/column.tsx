import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ColumnProps extends definition.UtilityProps {
	onClick?: () => void
}

const Column: FunctionComponent<ColumnProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				minHeight: "4em", //DELETE
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

export default Column
