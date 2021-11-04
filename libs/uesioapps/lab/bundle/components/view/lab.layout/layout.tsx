import { FC, useRef } from "react"
import { component, styles } from "@uesio/ui"
import { LayoutProps } from "./layoutdefinition"

const IOLayout = component.registry.getUtility("lab.layout")

const Layout: FC<LayoutProps> = (props) => {
	const {
		definition: { columnGap, justifyContent, alignItems, breakpoint },
		context,
		path,
	} = props

	const ref = useRef<HTMLDivElement>(null)

	const mediaQueryForBreakpoint = breakpoint
		? {
				[`@media (max-width: ${breakpoint})`]: {
					flexFlow: "column",
				},
		  }
		: {}

	const classes = styles.useStyles(
		{
			root: {
				justifyContent: justifyContent || "initial",
				alignItems: alignItems || "initial",
				gap: columnGap || "initial",
				display: "flex",
				flexFlow: "row wrap",
				...mediaQueryForBreakpoint,
			},
		},
		props
	)

	return (
		<IOLayout ref={ref} classes={classes} {...props}>
			<component.Slot
				parentRef={ref}
				definition={props.definition}
				listName="columns"
				path={path}
				accepts={["lab.column"]}
				context={context}
			/>
		</IOLayout>
	)
}

export default Layout
