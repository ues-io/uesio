import React, { FC } from "react"

import {
	definition,
	hooks,
	signal,
	action,
	material,
	builder,
	context,
} from "@uesio/ui"

import { TableDefinition, TableState } from "./tabledefinition"
import TableHeader from "./tableheader"
import TableBody from "./tablebody"
import Alert from "../alert/alert"

interface TableProps extends definition.BaseProps {
	definition: TableDefinition
}

const actionReducers: action.ActionGroup = {
	TOGGLE_MODE: (
		action: action.ComponentAction,
		state: TableState
	): TableState => {
		return Object.assign({}, state, {
			mode: state.mode === "READ" ? "EDIT" : "READ",
		})
	},
}

const signalHandlers: signal.SignalsHandler = {
	TOGGLE_MODE: {
		dispatcher: (
			signal: signal.ComponentSignal,
			ctx: context.Context
		): signal.ThunkFunc => {
			return async (
				dispatch: action.Dispatcher<action.ComponentAction>
			): signal.DispatchReturn => {
				dispatch({
					type: action.ACTOR,
					name: signal.signal,
					band: signal.band,
					target: signal.target,
					scope: signal.scope,
					data: {},
					view: ctx.getView()?.getId(),
				})
				return ctx
			}
		},
		public: true,
		label: "Toggle Mode",
		properties: (): builder.PropDescriptor[] => {
			return [
				{
					name: "target",
					type: "COMPONENT",
					scope: "material.table",
					label: "Target",
				},
			]
		},
	},
}

const Table: FC<TableProps> = (props: TableProps) => {
	const uesio = hooks.useUesio(props)
	const definition = props.definition
	const wire = uesio.wire.useWire(definition.wire)
	const collection = wire.getCollection()

	const initialState: TableState = {
		mode: definition.mode || "READ",
	}

	const componentActor = uesio.signal.useSignals(
		definition.id,
		signalHandlers,
		actionReducers,
		initialState
	)

	if (!wire.isValid() || !collection.isValid() || !componentActor.isValid())
		return null

	const state = componentActor.toState() as TableState

	const tableStyle = {
		marginBottom: "16px",
	}

	const bodyProps = {
		wire,
		collection,
		state,
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
