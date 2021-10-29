import { hooks, styles, component, context } from "@uesio/ui"
import { FunctionComponent } from "react"
import { useMode } from "../../shared/mode"
import { paginate, usePagination } from "../../shared/pagination"
import { ButtonUtilityProps } from "../../utility/io.button/button"
import { GroupUtilityProps } from "../../utility/io.group/group"
import { PaginatorUtilityProps } from "../../utility/io.paginator/paginator"
import { TableUtilityProps } from "../../utility/io.table/table"

import { ColumnDefinition, TableProps } from "./tabledefinition"

const Group = component.registry.getUtility<GroupUtilityProps>("io.group")
const Button = component.registry.getUtility<ButtonUtilityProps>("io.button")
const IOTable = component.registry.getUtility<TableUtilityProps>("io.table")
const Paginator =
	component.registry.getUtility<PaginatorUtilityProps>("io.paginator")

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

	if (!wire || !mode || !path || currentPage === undefined) return null

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const collection = wire.getCollection()

	const columns = definition.columns?.map((columnDef) => {
		const column = columnDef["io.column"] as ColumnDefinition
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
			cells: definition.columns?.map((columnDef) => {
				const column = columnDef["io.column"] as ColumnDefinition
				return column.components ? (
					<component.Slot
						definition={column}
						listName="components"
						path={`${path}["columns"]["${index}"]["io.column"]`}
						accepts={["uesio.context"]}
						direction="horizontal"
						context={recordContext}
					/>
				) : (
					<component.Component
						componentType="io.field"
						definition={{
							fieldId: column.field,
							hideLabel: true,
							"uesio.variant": "io.table",
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
					{definition.rowactions.map((action) => {
						const [handler, portals] = uesio.signal.useHandler(
							action.signals,
							recordContext
						)
						return (
							<Button
								variant="io.nav"
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
			{pageSize && (
				<Paginator
					setPage={setCurrentPage}
					currentPage={currentPage}
					maxPages={maxPages}
					context={context}
				/>
			)}
		</>
	)
}

export default Table
