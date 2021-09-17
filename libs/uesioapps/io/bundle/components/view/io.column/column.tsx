import { FC, useContext } from "react"
import { definition, component, styles } from "@uesio/ui"
import toPath from "lodash/toPath"
import { LayoutContext } from "../io.layout/layout"

const IOcolumn = component.registry.getUtility("io.column")

export const getColumnFlexStyles = (
	template: number[],
	path: string
): React.CSSProperties => {
	const columnIndex = parseInt(toPath(path).slice(-2)[0], 10)
	const flexRatio = template[columnIndex]
	return {
		flexGrow: flexRatio || "initial",
		flexShrink: flexRatio || "initial",
	}
}

const Column: FC<definition.BaseProps> = (props) => {
	const { definition, context, path = "" } = props
	const sharedProps = { context }

	const flexStyles = !context.getBuildMode()
		? getColumnFlexStyles(useContext(LayoutContext), path)
		: {}

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
				accepts={["uesio.standalone", "uesio.field"]}
				context={context}
			/>
		</IOcolumn>
	)
}

export default Column
