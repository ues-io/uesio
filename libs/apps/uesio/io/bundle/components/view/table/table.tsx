import { hooks, styles, component, definition } from "@uesio/ui"
import { FunctionComponent } from "react"
import { useMode } from "../../shared/mode"
import { paginate, usePagination } from "../../shared/pagination"
import { ButtonUtilityProps } from "../../utility/button/button"
import { GroupUtilityProps } from "../../utility/group/group"
import { PaginatorUtilityProps } from "../../utility/paginator/paginator"
import { TableUtilityProps } from "../../utility/table/table"

import { ColumnDefinition, TableProps } from "./tabledefinition"

const Group = component.getUtility<GroupUtilityProps>("uesio/io.group")
const Button = component.getUtility<ButtonUtilityProps>("uesio/io.button")
const IOTable = component.getUtility<TableUtilityProps>("uesio/io.table")
const Paginator =
	component.getUtility<PaginatorUtilityProps>("uesio/io.paginator")

const Table: FunctionComponent<TableProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const [mode] = useMode(definition.id, definition.mode, props)
	const [currentPage, setCurrentPage] = usePagination(
		definition.id,
		wire?.getBatchId(),
		props
	)
	const pageSize = definition.pagesize ? parseInt(definition.pagesize, 10) : 0

	const columnsToDisplay = definition.columns?.filter((columnDef) =>
		component.useShouldDisplay(
			context,
			columnDef["uesio/io.column"] as definition.DefinitionMap
		)
	)

	if (!wire || !mode || !path || currentPage === undefined) return null

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const collection = wire.getCollection()

	const columns = columnsToDisplay?.map((columnDef) => {
		const column = columnDef["uesio/io.column"] as ColumnDefinition
		const fieldId = column.field
		const fieldMetadata = collection.getField(fieldId)
		return {
			label: column.label || fieldMetadata?.getLabel() || "",
		}
	})

	const data = wire.getData()
	const maxPages = pageSize ? Math.ceil(data.length / pageSize) : 1

	const paginated = paginate(data, currentPage, pageSize)
	const rows = paginated.map((record, index) => {
		const recordContext = newContext.addFrame({
			record: record.getId(),
			wire: wire.getId(),
			fieldMode: mode,
		})
		return {
			cells: columnsToDisplay?.map((columnDef) => {
				const column = columnDef["uesio/io.column"] as ColumnDefinition
				return column.components ? (
					<component.Slot
						definition={column}
						listName="components"
						path={`${path}["columns"]["${index}"]["uesio/io.column"]`}
						accepts={["uesio.context"]}
						direction="horizontal"
						context={recordContext}
					/>
				) : (
					<component.Component
						componentType="uesio/io.field"
						definition={{
							fieldId: column.field,
							labelPosition: "none",
							"uesio.variant": "uesio/io.table",
						}}
						index={index}
						path={`${path}["columns"]["${index}"]`}
						context={recordContext}
					/>
				)
			}),
			rowactions: definition.rowactions && (
				<Group
					styles={{ root: { padding: "0 16px" } }}
					columnGap={0}
					context={recordContext}
				>
					{definition.rowactions.map((action, i) => {
						const handler = uesio.signal.getHandler(
							action.signals,
							recordContext
						)
						return (
							<Button
								key={action.text + i}
								variant="uesio/io.nav"
								className="rowaction"
								label={action.text}
								context={recordContext}
								onClick={handler}
							/>
						)
					})}
				</Group>
			),
			isDeleted: record.isDeleted(),
		}
	})

	return (
		<>
			<IOTable
				variant={definition["uesio.variant"]}
				rows={rows}
				columns={columns}
				context={context}
				classes={classes}
				showRowNumbers={definition.rownumbers}
				rowNumberStart={pageSize * currentPage}
				showRowActions={!!definition.rowactions}
			/>
			{pageSize > 0 && (
				<Paginator
					setPage={setCurrentPage}
					currentPage={currentPage}
					maxPages={maxPages}
					context={context}
					loadMore={
						wire.hasMore()
							? async () => {
									await uesio.signal.run(
										{
											signal: "wire/LOAD_NEXT_BATCH",
											wires: [wire.getId()],
										},
										context
									)
							  }
							: undefined
					}
				/>
			)}
		</>
	)
}

export default Table
