import { hooks, styles, component, wire } from "@uesio/ui"
import omit from "lodash/omit"
import partition from "lodash/partition"
import { FC } from "react"
import { useMode } from "../../shared/mode"
import { paginate, usePagination } from "../../shared/pagination"
import { ButtonUtilityProps } from "../../utilities/button/button"
import { GroupUtilityProps } from "../../utilities/group/group"
import { MenuButtonUtilityProps } from "../../utilities/menubutton/menubutton"
import { PaginatorUtilityProps } from "../../utilities/paginator/paginator"
import { TableUtilityProps } from "../../utilities/table/table"

import { ColumnDefinition, TableProps } from "./tabledefinition"

type RecordContext = component.ItemContext<wire.WireRecord>

type MenuItem = {
	label: string
}

const Group = component.getUtility<GroupUtilityProps>("uesio/io.group")
const Button = component.getUtility<ButtonUtilityProps>("uesio/io.button")
const MenuButton = component.getUtility<MenuButtonUtilityProps<MenuItem>>(
	"uesio/io.menubutton"
)
const IOTable =
	component.getUtility<TableUtilityProps<RecordContext, ColumnDefinition>>(
		"uesio/io.table"
	)
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

	const data = wire?.getData() || []

	const itemContexts = component.useContextFilter<wire.WireRecord>(
		data,
		definition.recordDisplay,
		(record, context) =>
			context.addFrame({
				record: record.getId(),
				wire: wire?.getId(),
				fieldMode: mode,
			}),
		newContext
	)

	const [selected, setSelected] = uesio.component.useStateSlice<
		Record<string, boolean>
	>("selected", componentId, {})

	if (!wire || !mode || !path || currentPage === undefined) return null

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const collection = wire.getCollection()

	const maxPages = pageSize ? Math.ceil(itemContexts.length / pageSize) : 1

	const paginated = paginate(itemContexts, currentPage, pageSize)

	const [defaultActions, otherActions] = partition(
		definition.rowactions,
		(action) => action.type === "DEFAULT"
	)

	const defaultActionsFunc = defaultActions.length
		? (recordContext: RecordContext) => {
				const handler = uesio.signal.getHandler(
					defaultActions.flatMap((action) => action.signals),
					recordContext.context
				)
				handler?.()
		  }
		: undefined

	const rowActionsFunc = otherActions.length
		? (recordContext: RecordContext) => (
				<Group
					styles={{ root: { padding: "0 16px" } }}
					columnGap={0}
					context={recordContext.context}
				>
					{otherActions.map((action, i) => {
						const handler = uesio.signal.getHandler(
							action.signals,
							recordContext.context
						)
						return (
							<Button
								key={action.text + i}
								variant="uesio/io.nav"
								className="rowaction"
								label={action.text}
								context={recordContext.context}
								onClick={handler}
							/>
						)
					})}
				</Group>
		  )
		: undefined

	const columnHeaderFunc = (column: ColumnDefinition) =>
		column.label || collection.getField(column.field)?.getLabel() || ""

	const columnMenuFunc = definition.order
		? (column: ColumnDefinition) =>
				column.field ? (
					<MenuButton
						icon="expand_more"
						items={[
							{ label: "Sort A-Z" },
							{ label: "Sort Z-A" },
							{ label: "Sort Remove Sorting" },
						]}
						itemRenderer={(item) => item.label}
						onSelect={(item) => console.log(item.label)}
						fill={false}
						context={context}
					/>
				) : undefined
		: undefined

	const cellFunc = (
		column: ColumnDefinition,
		recordContext: RecordContext,
		columnIndex: number
	) => {
		const sharedProps = {
			//key: recordContext.item.getId(),
			path: `${path}["columns"]["${columnIndex}"]`,
			context: recordContext.context,
		}

		return column.components ? (
			<component.Slot
				definition={column}
				listName="components"
				accepts={["uesio.context"]}
				direction="HORIZONTAL"
				{...sharedProps}
			/>
		) : (
			<component.Component
				componentType="uesio/io.field"
				definition={{
					fieldId: column.field,
					user: column.user,
					reference: column.reference,
					labelPosition: "none",
					wrapperVariant: "uesio/io.table",
					"uesio.variant": "uesio/io.field:uesio/io.table",
				}}
				{...sharedProps}
			/>
		)
	}

	const isAllSelectedFunc = definition.selectable
		? () => {
				if (!selected || Object.keys(selected).length === 0) {
					return false
				}
				if (Object.keys(selected).length === itemContexts.length) {
					return true
				}
				return undefined
		  }
		: undefined

	const onAllSelectChange = definition.selectable
		? (isSelected: boolean) => {
				setSelected(
					isSelected
						? Object.fromEntries(
								itemContexts.map((itemContext) => [
									itemContext.item.getId(),
									true,
								])
						  )
						: {}
				)
		  }
		: undefined

	const isSelectedFunc = definition.selectable
		? (recordContext: RecordContext) =>
				!!selected?.[recordContext.item.getId()]
		: undefined

	const onSelectChange = definition.selectable
		? (
				recordContext: RecordContext,
				index: number,
				isSelected: boolean
		  ) => {
				setSelected(
					isSelected
						? {
								...selected,
								...{
									[recordContext.item.getId()]: true,
								},
						  }
						: omit(selected, recordContext.item.getId())
				)
		  }
		: undefined

	const isDeletedFunc = (recordContext: RecordContext) =>
		recordContext.item.isDeleted()

	return (
		<>
			<IOTable
				variant={definition["uesio.variant"]}
				rows={paginated}
				columns={columnsToDisplay}
				context={context}
				classes={classes}
				rowNumberFunc={
					definition.rownumbers
						? (index: number) => pageSize * currentPage + index + ""
						: undefined
				}
				defaultActionFunc={defaultActionsFunc}
				rowActionsFunc={rowActionsFunc}
				columnHeaderFunc={columnHeaderFunc}
				columnMenuFunc={columnMenuFunc}
				cellFunc={cellFunc}
				isDeletedFunc={isDeletedFunc}
				isSelectedFunc={isSelectedFunc}
				onSelectChange={onSelectChange}
				onAllSelectChange={onAllSelectChange}
				isAllSelectedFunc={isAllSelectedFunc}
			/>
			{pageSize > 0 && maxPages > 1 && (
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
