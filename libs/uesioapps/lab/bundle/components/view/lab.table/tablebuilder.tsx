import React, { FunctionComponent } from "react"
import { TableProps } from "./tabledefinition"
import Table from "./table"
import { styles, component, hooks, wire } from "@uesio/ui"
import WireHelper from "../../utility/lab.wirehelper/wirehelper"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const TableBuilder: FunctionComponent<TableProps> = (props) => {
	const { context, path = "", definition } = props
	const uesio = hooks.useUesio(props)

	const [wire, setWire] = React.useState<undefined | wire.Wire>(undefined)

	const [dragType, dragItem, dragPath] = uesio.builder.useDragNode()
	const classes = styles.useStyles(
		{
			root: {},
			header: {},
		},
		{
			context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			{!wire ? (
				<WireHelper {...props} key={definition.wire} />
			) : (
				<Table {...props} isDragging={!!dragType && !!dragItem} />
			)}
		</BuildWrapper>
	)
}

export default TableBuilder
