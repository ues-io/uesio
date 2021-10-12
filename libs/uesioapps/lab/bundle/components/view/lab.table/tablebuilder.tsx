import { FunctionComponent } from "react"
import { TableProps } from "./tabledefinition"
import Table from "./table"
import { styles, component, hooks } from "@uesio/ui"
import WireHelper from "../../wirehelper"
import FieldHints from "../lab.column/fieldhints"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const TableBuilder: FunctionComponent<TableProps> = (props) => {
	const { context, path = "", definition } = props
	const uesio = hooks.useUesio(props)

	// const { fitToContent } = context.getParentComponentDef(path)
	const wire = uesio.wire.useWire(definition.wire)

	const classes = styles.useStyles(
		{
			root: {},
			header: {},
		},
		{
			context,
		}
	)

	console.log({ wire })

	return (
		<BuildWrapper {...props} classes={classes}>
			{!wire ? <WireHelper {...props} /> : <Table {...props} />}
		</BuildWrapper>
	)
}

export default TableBuilder
