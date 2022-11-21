import { FunctionComponent } from "react"
import { TableProps } from "./tabledefinition"
import Table from "./table"
import { styles, component } from "@uesio/ui"

const BuildWrapper = component.getUtility("uesio/builder.buildwrapper")

const TableBuilder: FunctionComponent<TableProps> = (props) => {
	const { context } = props
	const classes = styles.useStyles(
		{
			inner: {
				".rowaction": {
					pointerEvents: "none",
				},
			},
		},
		{
			context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<Table
				{...props}
				context={context.addFrame({
					buildMode: false,
				})}
			/>
		</BuildWrapper>
	)
}

export default TableBuilder
