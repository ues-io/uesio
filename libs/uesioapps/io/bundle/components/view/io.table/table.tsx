import { hooks, styles } from "@uesio/ui"
import { FunctionComponent } from "react"

import { TableProps, TableState } from "./tabledefinition"
import TableHeader from "./tableheader"
import TableBody from "./tablebody"

const Table: FunctionComponent<TableProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const [componentState] = uesio.component.useState<TableState>(
		definition.id,
		{
			mode: definition.mode || "READ",
		}
	)

	const classes = styles.useStyles(
		{
			root: {
				display: "grid",
				overflow: "auto",
			},
			table: {
				width: "100%",
				overflow: "hidden",
			},
			header: {},
			headerCell: {
				"&:last-child": {
					borderRight: 0,
				},
			},
			cell: {
				"&:last-child": {
					borderRight: 0,
				},
			},
			row: {
				"&:last-child>td": {
					borderBottom: 0,
				},
			},
			rowDeleted: {},
		},
		props
	)

	if (!wire || !componentState || !path) return null

	const collection = wire.getCollection()

	return (
		<div className={classes.root}>
			<table className={classes.table}>
				<TableHeader
					classes={classes}
					columns={definition.columns}
					rowactions={definition.rowactions}
					collection={collection}
				/>
				<TableBody
					classes={classes}
					wire={wire}
					collection={collection}
					state={componentState}
					columns={definition.columns}
					rowactions={definition.rowactions}
					path={path}
					context={newContext}
				/>
			</table>
		</div>
	)
}

export default Table
