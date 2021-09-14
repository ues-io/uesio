import { FunctionComponent } from "react"
import { component, styles } from "@uesio/ui"
import { LayoutProps } from "./Layoutdefinition"

const IOLayout = component.registry.getUtility("io.layout")

const Layout: FunctionComponent<LayoutProps> = (props) => {
	const { definition, context, path } = props

	const columnGap = definition.columnGap && {
		columnGap: definition.columnGap,
	}

	const breakpoint = definition.breakpoint && {
		[`@media (max-width: ${definition.breakpoint})`]: {
			flexFlow: "column",
		},
	}

	const classes = styles.useStyles(
		{
			root: {
				...columnGap,
				display: "flex",
				...breakpoint,
				justifyContent: definition.justifyContent || "initial",
				alignItems: definition.alignItems || "initial",
				gap: definition.columnGutterSize || "initial",
				flexFlow: "row wrap",
			},
		},
		props
	)

	return (
		<IOLayout classes={classes} {...props}>
			<component.Slot
				definition={definition}
				listName="columns"
				path={path}
				accepts={["io.column"]}
				context={context}
			/>
		</IOLayout>
	)
}

export default Layout
