import { FC } from "react"
import { component, styles } from "@uesio/ui"
import { ColumnProps } from "./columndefinition"

const IOcolumn = component.registry.getUtility("io.column")

const Column: FC<ColumnProps> = (props) => {
	const { definition, context, path } = props

	const sharedProps = { context }

	const classes = styles.useStyles(
		{
			root: {
				flex: definition?.flexRatio || "initial",
			},
		},
		props
	)

	return (
		<IOcolumn classes={classes} {...sharedProps}>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["io.griditem", "uesio.standalone", "uesio.field"]}
				context={context}
			/>
		</IOcolumn>
	)
}

export default Column
