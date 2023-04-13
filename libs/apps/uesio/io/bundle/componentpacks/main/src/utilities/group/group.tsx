import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"
import Grid from "../grid/grid"

interface GroupUtilityProps extends definition.UtilityProps {
	columnGap?: string | number
	alignItems?: string
	justifyContent?: string
}

const Group: FunctionComponent<GroupUtilityProps> = (props) => {
	const { columnGap, context, children, alignItems, justifyContent } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				gridAutoFlow: "column",
				columnGap: columnGap || columnGap === 0 ? columnGap : "10px",
				alignItems,
				justifyContent,
				gridAutoColumns: "min-content",
			},
		},
		props
	)
	return (
		<Grid classes={classes} context={context}>
			{children}
		</Grid>
	)
}

export default Group
