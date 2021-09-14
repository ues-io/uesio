import { FC, useMemo } from "react"
import { component, styles } from "@uesio/ui"
import { ColumnProps } from "./columndefinition"

const IOcolumn = component.registry.getUtility("io.column")

const Column: FC<ColumnProps> = (props) => {
	const { definition, context, path } = props

	const sharedProps = { context }

	const { getFlexStyles } =
		component.registry.getPropertiesDefinition("io.column")

	const flexStyles = useMemo(
		() =>
			getFlexStyles && !context.getBuildMode()
				? getFlexStyles(definition)
				: {},
		[definition]
	)

	const classes = styles.useStyles(
		{
			root: {
				...flexStyles,
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
