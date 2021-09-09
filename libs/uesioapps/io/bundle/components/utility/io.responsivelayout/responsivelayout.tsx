import { FC } from "react"
import { definition, styles } from "@uesio/ui"

interface T extends definition.UtilityProps {
	onClick?: () => void
}

const Grid: FC<T> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
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
