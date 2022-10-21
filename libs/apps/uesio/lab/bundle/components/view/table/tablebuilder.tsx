import { FunctionComponent } from "react"
import { TableProps } from "./tabledefinition"
import Table from "./table"
import { styles, component, hooks } from "@uesio/ui"
import WireHelper from "../../utility/wirehelper/wirehelper"

const BuildWrapper = component.getUtility("uesio/builder.buildwrapper")

const TableBuilder: FunctionComponent<TableProps> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)

	const wire = uesio.wire.useWire(definition.wire)

	const [dragType, dragItem] = uesio.builder.useDragNode()
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
				<WireHelper {...props} />
			) : (
				<Table {...props} isDragging={!!dragType && !!dragItem} />
			)}
		</BuildWrapper>
	)
}

export default TableBuilder
