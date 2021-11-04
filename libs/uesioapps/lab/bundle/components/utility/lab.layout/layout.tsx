import { FC, forwardRef } from "react"
import { definition, styles } from "@uesio/ui"

const Layout: FC<definition.UtilityProps> = forwardRef<
	HTMLDivElement,
	definition.UtilityProps
>((props, ref) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
			},
		},
		props
	)

	return <div className={classes.root}>{props.children}</div>
})

export default Layout
