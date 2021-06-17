import { FunctionComponent } from "react"
import { TableProps, TableDefinition } from "./tabledefinition"
import Table from "./table"
import { hooks } from "@uesio/ui"

const TableBuilder: FunctionComponent<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as TableDefinition

	return <Table {...props} definition={definition} />
}

export default TableBuilder
