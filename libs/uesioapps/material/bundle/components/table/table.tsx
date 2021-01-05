import React, { FunctionComponent } from "react"

import { definition, hooks, material } from "@uesio/ui"

import { TableDefinition, TableState } from "./tabledefinition"
import TableHeader from "./tableheader"
import TableBody from "./tablebody"
import Alert from "../alert/alert"

interface TableProps extends definition.BaseProps {
	definition: TableDefinition
}

const Table: FunctionComponent<TableProps> = (props) => {
	const { definition, path, context } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	const initialState: TableState = {
		mode: definition.mode || "READ",
	}

	const componentState = uesio.component.useState(
		definition.id,
		initialState
	) as TableState

	if (!wire || !componentState) return null

	const collection = wire.getCollection()
	return (
		<>
			{wire.source.error && (
				<Alert {...props} severity="error">
					{wire.source.error}
				</Alert>
			)}
			<material.Table style={{ marginBottom: "16px" }}>
				<TableHeader
					columns={definition.columns}
					collection={collection}
				/>
				<TableBody
					wire={wire}
					collection={collection}
					state={componentState}
					columns={definition.columns}
					path={path}
					context={context}
				/>
			</material.Table>
		</>
	)
}

export { TableProps }

export default Table
