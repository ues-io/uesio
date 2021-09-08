import { FunctionComponent } from "react"
import { component, styles } from "@uesio/ui"
import { ResponsiveLayoutProps } from "./responsiveLayoutdefinition"

const IOresponsiveLayout = component.registry.getUtility("io.responsivelayout")

const responsiveLayout: FunctionComponent<ResponsiveLayoutProps> = (props) => {
	const { definition, context, path } = props

	const columnGap = definition.columnGap && {
		columnGap: definition.columnGap,
	}

	const classes = styles.useStyles(
		{
			root: {
				...columnGap,
				display: "flex",
				justifyContent: "space-between",
				flexFlow: "row wrap",
			},
		},
		props
	)

	return (
		<IOresponsiveLayout classes={classes} {...props}>
			<component.Slot
				definition={definition}
				listName="columns"
				path={path}
				accepts={["io.column"]}
				context={context}
			/>
		</IOresponsiveLayout>
	)
}

export default responsiveLayout
