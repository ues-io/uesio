import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

const IOGrid = component.getUtility("uesio/io.grid")

interface GroupUtilityProps extends definition.UtilityProps {
	columnGap?: string | number
	alignItems?: string
}

const Group: FunctionComponent<GroupUtilityProps> = (props) => {
	const { columnGap, context, children, alignItems } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				gridAutoFlow: "column",
				columnGap: columnGap || columnGap === 0 ? columnGap : "10px",
				alignItems,
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
