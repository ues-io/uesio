import { FunctionComponent } from "react"
import { TableColumnProps } from "./tablecolumndefinition"
import TableColumn from "./tablecolumn"

import { styles, component } from "@uesio/ui"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const TableBuilder: FunctionComponent<TableColumnProps> = (props) => {
	const { context, path = "", definition } = props

	const classes = styles.useStyles(
		{
			root: {
				flex: 1,
				border: "none",
				// order: definition.order || "initial",

				".hint": {
					maxHeight: "0px",
					opacity: 0,
					willChange: "max-height",
					transition: "all 0.6s ease",
				},

				"&:hover .hint": {
					opacity: 1,
					maxHeight: "100px",
				},
			},
			inner: {
				padding: "0",
				height: "100%",
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
				context={
					definition.id === "rowActions"
						? context.addFrame({
								buildMode: false,
						  })
						: context
				}
			/>
		</BuildWrapper>
	)
}

export default TableBuilder
