import { forwardRef, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface GridProps extends definition.UtilityProps {
	onClick?: () => void
}

const Grid: FunctionComponent<GridProps> = forwardRef<
	HTMLDivElement,
	GridProps
>((props, ref) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "grid",
			},
		},
		props
	)
	return (
		<div ref={ref} onClick={props.onClick} className={classes.root}>
			{props.children}
		</div>
	)
})

export default Grid
