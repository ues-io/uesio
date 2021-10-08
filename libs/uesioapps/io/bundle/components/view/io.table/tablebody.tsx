import { FunctionComponent } from "react"
import {
	wire,
	collection,
	context,
	component,
	definition,
	styles,
	hooks,
} from "@uesio/ui"
import {
	ColumnDefinition,
	RowAction,
	TableClasses,
	TableState,
} from "./tabledefinition"

interface Props {
	wire: wire.Wire
	collection: collection.Collection
	columns: definition.DefinitionList
	rowactions: RowAction[]
	rownumbers: boolean
	path: string
	context: context.Context
	state: TableState
	classes: TableClasses
}

interface RowProps {
	wire: wire.Wire
	path: string
	columns: definition.DefinitionList
	rowactions: RowAction[]
	rownumbers: boolean
	index: number
	context: context.Context
	mode: context.FieldMode
	record: wire.WireRecord
	classes: TableClasses
}

interface CellProps {
	column: ColumnDefinition
	context: context.Context
	path: string
	index: number
	classes: TableClasses
}

const FieldCell: FunctionComponent<CellProps> = ({
	column: { field },
	path,
	index,
	context,
	classes,
}) => (
	<td key={field} className={classes.cell}>
		<component.Component
			componentType="io.field"
			definition={{
				fieldId: field,
				hideLabel: true,
				"uesio.variant": "io.table",
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
	classes,
}) => {
	const fieldId = column.field
	return (
		<td key={fieldId} className={classes.cell}>
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

const Group = component.registry.getUtility("io.group")
const Button = component.registry.getUtility("io.button")

const TableRow: FunctionComponent<RowProps> = ({
	path,
	wire,
	columns,
	rowactions,
	rownumbers,
	index,
	context,
	mode,
	record,
	classes,
}) => {
	const rowContext = context.addFrame({
		record: record.getId(),
		wire: wire.getId(),
		fieldMode: mode,
	})
	const uesio = hooks.useUesio({ context: rowContext })
	return (
		<tr
			className={styles.cx(
				classes.row,
				record.isDeleted() && classes.rowDeleted
			)}
		>
			{rownumbers && (
				<td
					className={styles.cx(classes.cell, classes.rowNumberCell)}
					key="rownumbers"
				>
					<div className={classes.rowNumber}>{index + 1}</div>
				</td>
			)}
			{columns?.map((columnDef, index) => {
				const column = columnDef["io.column"] as ColumnDefinition
				const Cell = column.components ? SlotCell : FieldCell
				return (
					<Cell
						classes={classes}
						key={index}
						column={column}
						context={rowContext}
						path={path}
						index={index}
					/>
				)
			})}
			{rowactions && (
				<td key="rowactions" className={classes.cell}>
					<Group
						styles={{ root: { padding: "0 16px" } }}
						columnGap={0}
						context={rowContext}
					>
						{rowactions.map((action) => {
							const [handler, portals] = uesio.signal.useHandler(
								action.signals
							)
							return (
								<Button
									variant="io.nav"
									className="rowaction"
									label={action.text}
									context={rowContext}
									onClick={handler}
								/>
							)
						})}
					</Group>
				</td>
			)}
		</tr>
	)
}

const TableBody: FunctionComponent<Props> = ({
	wire,
	path,
	columns,
	rowactions,
	rownumbers,
	context,
	state: { mode },
	classes,
}) => (
	<tbody>
		{wire.getData().map((record, index) => (
			<TableRow
				classes={classes}
				key={record.getId()}
				wire={wire}
				path={path}
				columns={columns}
				rowactions={rowactions}
				rownumbers={rownumbers}
				index={index}
				context={context}
				mode={mode}
				record={record}
			/>
		))}
	</tbody>
)

export default TableBody
