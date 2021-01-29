import React, { FunctionComponent, useEffect, useRef, forwardRef } from "react"

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

const FieldCell: FunctionComponent<CellProps> = ({
	column: { field },
	path,
	index,
	context,
}: CellProps) => (
	<material.TableCell key={field}>
		<component.Component
			componentType="material.field"
			definition={{
				fieldId: field,
				hideLabel: true,
			}}
			index={index}
			path={`${path}["columns"]["${index}"]`}
			context={context}
		/>
	</material.TableCell>
)

const SlotCell: FunctionComponent<CellProps> = (props: CellProps) => {
	const { column, path, index, context } = props
	const fieldId = column.field
	return (
		<material.TableCell key={fieldId}>
			<component.Slot
				definition={column}
				listName="components"
				path={`${path}["columns"]["${index}"]["material.column"]`}
				accepts={["uesio.context"]}
				direction="horizontal"
				context={context}
			/>
		</material.TableCell>
	)
}

const TableRow: FunctionComponent<RowProps> = forwardRef<
	HTMLTableRowElement,
	RowProps
>((props, ref) => {
	const { path, wire, columns, context, mode, record } = props
	const style = wire.isMarkedForDeletion(record.getId())
		? { backgroundColor: "#ffcdd2" }
		: {}
	return (
		<material.TableRow style={style} ref={ref}>
			{columns.map((columnDef, index) => {
				const column = columnDef["material.column"] as ColumnDefinition

				if (!column.components) {
					return (
						<FieldCell
							key={index}
							column={column}
							context={context.addFrame({
								record: record.getId(),
								wire: wire.getId(),
								fieldMode: mode,
							})}
							path={path}
							index={index}
						/>
					)
				}

				return (
					<SlotCell
						key={index}
						column={column}
						context={context.addFrame({
							record: record.getId(),
							wire: wire.getId(),
							fieldMode: mode,
						})}
						path={path}
						index={index}
					/>
				)
			})}
		</material.TableRow>
	)
})

const TableBody: FunctionComponent<Props> = ({
	wire,
	path,
	columns,
	context,
	state,
}) => {
	const data = wire.getData()
	const lastRowRef = useRef<HTMLTableRowElement | null>(null)

	// this logic serves for focusing on the right now created
	const newlyCreatedRow =
		data.length > 0 && JSON.stringify(data[data.length - 1].source) === "{}"

	useEffect(() => {
		if (newlyCreatedRow) {
			const node = lastRowRef?.current?.querySelector?.("input")
			node?.focus?.()
		}
	})

	return (
		<material.TableBody>
			{data.map((record, index, array) => (
				<TableRow
					key={record.getId()}
					wire={wire}
					path={path}
					columns={columns}
					context={context}
					mode={state.mode}
					record={record}
					{...(index === array.length - 1 && newlyCreatedRow
						? { ref: lastRowRef }
						: {})}
				/>
			))}
		</material.TableBody>
	)
}

export default TableBody
