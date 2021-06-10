import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

const IOGrid = component.registry.getUtility("io.grid")

interface GroupProps extends definition.UtilityProps {
	columnGap: string | number
}

const Group: FunctionComponent<GroupProps> = (props) => {
	const { columnGap, context, children } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				gridAutoFlow: "column",
				columnGap: columnGap || columnGap === 0 ? columnGap : "10px",
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

export default Group
