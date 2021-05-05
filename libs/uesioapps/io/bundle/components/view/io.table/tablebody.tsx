import { FunctionComponent } from "react"
import { wire, collection, context, component, definition } from "@uesio/ui"
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
	mode: context.FieldMode
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
}) => (
	<td key={field}>
		<component.Component
			componentType="io.field"
			definition={{
				fieldId: field,
				hideLabel: true,
			}}
			index={index}
			path={`${path}["columns"]["${index}"]`}
			context={context}
		/>
	</td>
)

const SlotCell: FunctionComponent<CellProps> = ({
	column,
	path,
	index,
	context,
}) => {
	const fieldId = column.field
	return (
		<td key={fieldId}>
			<component.Slot
				definition={column}
				listName="components"
				path={`${path}["columns"]["${index}"]["io.column"]`}
				accepts={["uesio.context"]}
				direction="horizontal"
				context={context}
			/>
		</td>
	)
}

const TableRow: FunctionComponent<RowProps> = ({
	path,
	wire,
	columns,
	context,
	mode,
	record,
}) => (
	<tr>
		{columns.map((columnDef, index) => {
			const column = columnDef["io.column"] as ColumnDefinition

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
	</tr>
)

const TableBody: FunctionComponent<Props> = ({
	wire,
	path,
	columns,
	context,
	state: { mode },
}) => (
	<tbody>
		{wire.getData().map((record) => (
			<TableRow
				key={record.getId()}
				wire={wire}
				path={path}
				columns={columns}
				context={context}
				mode={mode}
				record={record}
			/>
		))}
	</tbody>
)

export default TableBody
