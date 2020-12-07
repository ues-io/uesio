import React, { FC } from "react"

import { definition, hooks, material } from "@uesio/ui"

import { TableDefinition, TableState } from "./tabledefinition"
import TableHeader from "./tableheader"
import TableBody from "./tablebody"
import Alert from "../alert/alert"

interface TableProps extends definition.BaseProps {
	definition: TableDefinition
}

const Table: FC<TableProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = props.definition
	const wire = uesio.wire.useWire(definition.wire)
	const collection = wire.getCollection()

	const initialState: TableState = {
		mode: definition.mode || "READ",
	}

	const componentState = uesio.signal.useComponentState(
		definition.id,
		initialState
	) as TableState

	if (!wire.isValid() || !collection.isValid() || !componentState) return null

	const tableStyle = {
		marginBottom: "16px",
	}

	const bodyProps = {
		wire,
		collection,
		state: componentState,
		columns: definition.columns,
		path: props.path,
		context: props.context,
	}

	return (
		<>
			{wire.source.error && (
				<Alert {...props} severity="error">
					{wire.source.error}
				</Alert>
			)}
			<material.Table style={tableStyle}>
				<TableHeader
					columns={definition.columns}
					collection={collection}
				/>
				<TableBody {...bodyProps} />
			</material.Table>
		</>
	)
}

Table.displayName = "Table"

export { TableProps }

export default Table
