import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

const IOGrid = component.registry.getUtility("io.grid")

interface GroupProps extends definition.UtilityProps {
	columnGap: string
}

const Group: FunctionComponent<GroupProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				gridAutoFlow: "column",
				columnGap: props.columnGap || "10px",
			},
		},
		props
	)
	return (
		<IOGrid classes={classes} context={props.context}>
			{props.children}
		</IOGrid>
	)
}

export default Group
