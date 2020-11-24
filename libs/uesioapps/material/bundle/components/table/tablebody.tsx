import React, { FC } from "react"

import {
	material,
	wire,
	collection,
	context,
	component,
	definition,
} from "@uesio/ui"
import { field } from "@uesio/constants"
import { ColumnDefinition, TableState } from "./tabledefinition"

interface Props {
	wire: wire.Wire
	collection: collection.Collection
	columns: definition.DefinitionList
	path: string
	context: context.Context
	state: TableState
}

interface RowProps {
	wire: wire.Wire
	path: string
	columns: definition.DefinitionList
	context: context.Context
	mode: field.FieldMode
	record: wire.WireRecord
}

interface CellProps {
	column: ColumnDefinition
	context: context.Context
	path: string
	index: number
}

const FieldCell: FC<CellProps> = (props: CellProps) => {
	const column = props.column
	const fieldId = column.field
	const path = props.path
	const index = props.index
	return (
		<material.TableCell key={fieldId}>
			{component.create(
				{
					"material.field": {
						fieldId,
						hideLabel: true,
					},
				},
				index,
				path + '["columns"]["' + index + '"]',
				props.context
			)}
		</material.TableCell>
	)
}

const SlotCell: FC<CellProps> = (props: CellProps) => {
	const column = props.column
	const fieldId = column.field
	const path = props.path
	const index = props.index

	const slotProps = {
		definition: column,
		listName: "components",
		path: path + '["columns"]["' + index + '"]["material.column"]',
		accepts: ["uesio.context"],
		direction: "horizontal",
		context: props.context,
	}
	return (
		<material.TableCell key={fieldId}>
			<component.Slot {...slotProps}></component.Slot>
		</material.TableCell>
	)
}

const TableRow: FC<RowProps> = (props: RowProps) => {
	const path = props.path
	const wire = props.wire
	const columns = props.columns
	const context = props.context
	const mode = props.mode
	const record = props.record

	const style = wire.isMarkedForDeletion(record.getId())
		? {
				backgroundColor: "#ffcdd2",
		  }
		: {}
	return (
		<material.TableRow style={style}>
			{columns.map((columnDef, index) => {
				const column = columnDef["material.column"] as ColumnDefinition

				const cellProps: CellProps = {
					column,
					context: context.addFrame({
						record: record.getId(),
						wire: wire.getId(),
						fieldMode: mode,
					}),
					path,
					index,
				}

				if (!column.components) {
					return <FieldCell {...cellProps}></FieldCell>
				}

				return <SlotCell key={index} {...cellProps}></SlotCell>
			})}
		</material.TableRow>
	)
}

const TableBody: FC<Props> = (props: Props) => {
	const wire = props.wire
	const data = wire.getData()

	return (
		<material.TableBody>
			{data.map((record) => {
				return (
					<TableRow
						key={record.getId()}
						wire={wire}
						path={props.path}
						columns={props.columns}
						context={props.context}
						mode={props.state.mode}
						record={record}
					></TableRow>
				)
			})}
		</material.TableBody>
	)
}

TableBody.displayName = "TableBody"

export default TableBody
