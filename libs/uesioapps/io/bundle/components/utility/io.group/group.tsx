import { FunctionComponent, forwardRef } from "react"
import { definition, styles, component } from "@uesio/ui"

const IOGrid = component.registry.getUtility("io.grid")

interface GroupUtilityProps extends definition.UtilityProps {
	columnGap?: string | number
	alignItems?: string
}

const Group: FunctionComponent<GroupUtilityProps> = forwardRef<
	HTMLDivElement,
	GroupUtilityProps
>((props, ref) => {
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
		<IOGrid ref={ref} classes={classes} context={context}>
			{children}
		</IOGrid>
	)
})

export { GroupUtilityProps }

export default Group
