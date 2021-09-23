import { FC } from "react"
import { definition, component, styles } from "@uesio/ui"

const IOColumn = component.registry.getUtility("io.column")

export const getColumnFlexStyles = (
	template: string,
	columnIndex: number
): React.CSSProperties => {
	const templateArray = template.split(",")
	const flexRatio = parseInt(templateArray[columnIndex], 10)
	return {
		flexGrow: flexRatio || "initial",
		flexShrink: flexRatio || "initial",
	}
}

const Column: FC<definition.BaseProps> = (props) => {
	const { definition, context, path = "", index = 0 } = props
	const sharedProps = { context }
	const template = context.getParentComponentDef(path)?.template

	const flexStyles = context.getBuildMode()
		? {}
		: getColumnFlexStyles(template, index)

	const classes = styles.useStyles(
		{
			root: {
				...flexStyles,
			},
		},
		props
	)

	return (
		<IOColumn classes={classes} {...sharedProps}>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["io.griditem", "uesio.standalone", "uesio.field"]}
				context={context}
			/>
		</IOColumn>
	)
}

export default Column
