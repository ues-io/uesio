import { FunctionComponent } from "react"

import { wire, collection, context, component, definition } from "@uesio/ui"
import { ColumnDefinition, TableState } from "./tabledefinition"
import * as material from "@material-ui/core"

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

const SlotCell: FunctionComponent<CellProps> = ({
	column,
	path,
	index,
	context,
}) => {
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

const TableRow: FunctionComponent<RowProps> = ({
	path,
	wire,
	columns,
	context,
	mode,
	record,
}) => {
	const style = wire.isMarkedForDeletion(record.getId())
		? { backgroundColor: "#ffcdd2" }
		: {}
	return (
		<material.TableRow style={style}>
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
}

const TableBody: FunctionComponent<Props> = ({
	wire,
	path,
	columns,
	context,
	state: { mode },
}) => (
	<material.TableBody>
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
	</material.TableBody>
)

export default TableBody
