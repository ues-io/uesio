import { hooks, styles, component } from "@uesio/ui"
import { FC } from "react"
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

const Table: FC<TableProps> = (props) => {
	const { path, context, definition } = props
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const componentId = uesio.component.getId(definition.id)
	const [mode] = useMode(componentId, definition.mode, props)
	const [currentPage, setCurrentPage] = usePagination(
		componentId,
		wire?.getBatchId(),
		props
	)
	const pageSize = definition.pagesize ? parseInt(definition.pagesize, 10) : 0

	const columnsToDisplay = component.useShouldFilter(
		definition.columns,
		context
	)

	if (!wire || !mode || !path || currentPage === undefined) return null

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const collection = wire.getCollection()

	const columns = columnsToDisplay.map((columnDef: ColumnDefinition) => ({
		label:
			columnDef.label ||
			collection.getField(columnDef.field)?.getLabel() ||
			"",
	}))

	const data = wire.getData()
	const maxPages = pageSize ? Math.ceil(data.length / pageSize) : 1

	const paginated = paginate(data, currentPage, pageSize)
	const rows = paginated.map((record, index) => {
		const recordContext = newContext.addFrame({
			record: record.getId(),
			wire: wire.getId(),
			fieldMode: mode,
		})
		const sharedProps = {
			key: paginated.length + index,
			path: `${path}["columns"]["${index}"]`,
			context: recordContext,
		}
		return {
			cells: columnsToDisplay?.map((columnDef) =>
				columnDef.components ? (
					<component.Slot
						definition={columnDef}
						listName="components"
						accepts={["uesio.context"]}
						direction="horizontal"
						{...sharedProps}
					/>
				) : (
					<component.Component
						componentType="uesio/io.field"
						definition={{
							fieldId: columnDef.field,
							labelPosition: "none",
							"uesio.variant": "uesio/io.table",
						}}
						index={index}
						{...sharedProps}
					/>
				)
			),
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
