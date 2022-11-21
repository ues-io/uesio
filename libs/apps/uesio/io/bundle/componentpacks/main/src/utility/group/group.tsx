import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

const IOGrid = component.getUtility("uesio/io.grid")

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
		<IOGrid classes={classes} context={context}>
			{children}
		</IOGrid>
	)
}

export { GroupUtilityProps }

export default Group
