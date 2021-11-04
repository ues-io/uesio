import { FC, forwardRef } from "react"
import { definition, styles } from "@uesio/ui"

const Column: FC<definition.UtilityProps> = forwardRef<
	HTMLDivElement,
	definition.UtilityProps
>((props, ref) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props
	)
	return (
		<div ref={ref} className={classes.root}>
			{props.children}
		</div>
	)
})

export default Column
