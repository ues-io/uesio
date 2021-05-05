import { hooks, component, styles } from "@uesio/ui"
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
			root: {},
		},
		props
	)

	if (!wire || !componentState || !path) return null

	const collection = wire.getCollection()

	return (
		<table className={classes.root}>
			<TableHeader columns={definition.columns} collection={collection} />
			<TableBody
				wire={wire}
				collection={collection}
				state={componentState}
				columns={definition.columns}
				path={path}
				context={newContext}
			/>
		</table>
	)
}

export default Table
