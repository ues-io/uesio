import { FunctionComponent } from "react"
import { TableColumnProps } from "./tablecolumndefinition"
import TableColumn from "./tablecolumn"
import { styles, component } from "@uesio/ui"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const TableBuilder: FunctionComponent<TableColumnProps> = (props) => {
	const { context, path = "", definition } = props
	const { fitToContent } = context.getParentComponentDef(path)

	const classes = styles.useStyles(
		{
			root: {
				flex: fitToContent ? "none" : 1,
				order: definition.order || "initial",
			},
			header: {
				display: "none",
			},
		},
		{
			context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<TableColumn
				{...props}
				// context={context.addFrame({
				// 	buildMode: false,
				// })}
			/>
		</BuildWrapper>
	)
}

export default TableBuilder
