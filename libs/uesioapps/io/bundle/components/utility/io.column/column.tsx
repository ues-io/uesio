import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ColumnProps extends definition.UtilityProps {
	onClick?: () => void
}

const Column: FunctionComponent<ColumnProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				background: "rgba(56, 163, 245, 0.349)",
				border: "1px solid #eee",
				flex: 1,
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
