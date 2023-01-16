import {
	api,
	styles,
	component,
	wire,
	signal,
	definition,
	context,
} from "@uesio/ui"
import omit from "lodash/omit"
import partition from "lodash/partition"
import {
	setEditMode,
	setReadMode,
	toggleMode,
	useMode,
} from "../../shared/mode"
import {
	nextPage,
	paginate,
	prevPage,
	usePagination,
} from "../../shared/pagination"
import Button from "../../utilities/button/button"
import Group from "../../utilities/group/group"
import MenuButton from "../../utilities/menubutton/menubutton"
import Paginator from "../../utilities/paginator/paginator"
import { default as IOTable } from "../../utilities/table/table"

import {
	NumberFieldOptions,
	ReferenceFieldOptions,
	LongTextFieldOptions,
	UserFieldOptions,
} from "../field/field"

type TableDefinition = {
	id: string
	wire: string
	mode: context.FieldMode
	columns: ColumnDefinition[]
	rowactions?: RowAction[]
	recordDisplay?: component.DisplayCondition[]
	rownumbers?: boolean
	pagesize?: string
	order?: boolean
	selectable?: boolean
}

type RowAction = {
	text: string
	signals: signal.SignalDefinition[]
	type?: "DEFAULT"
}

type ColumnDefinition = {
	field: string
	reference?: ReferenceFieldOptions
	user?: UserFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	label: string
	components: definition.DefinitionList
} & definition.BaseDefinition

type RecordContext = component.ItemContext<wire.WireRecord>

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_EDIT_MODE: setEditMode,
	SET_READ_MODE: setReadMode,
	NEXT_PAGE: nextPage,
	PREV_PAGE: prevPage,
}

const Table: definition.UC<TableDefinition> = (props) => {
	const { path, context, definition } = props
	const wire = api.wire.useWire(definition.wire, context)

	// If we got a wire from the definition, add it to context
	const newContext = definition.wire
		? context.addFrame({
				wire: definition.wire,
		  })
		: context

	const componentId = api.component.getComponentIdFromProps(
		definition.id,
		props
	)
	const [mode] = useMode(componentId, definition.mode)
	const [currentPage, setCurrentPage] = usePagination(
		componentId,
		wire?.getBatchId()
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

	const [selected, setSelected] = api.component.useStateSlice<
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
				const handler = api.signal.getHandler(
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
						const handler = api.signal.getHandler(
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
						itemRenderer={(item: ColumnDefinition) => item.label}
						onSelect={(item: ColumnDefinition) =>
							console.log(item.label)
						}
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
					number: column.number,
					longtext: column.longtext,
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
									await api.signal.run(
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

Table.signals = signals

/*
const TablePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Table",
	description: "View and edit tabular data.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({ id: "NewId", mode: "READ" }),
	properties: [
		{
			name: "id",
			type: "TEXT",
			label: "id",
		},
		{
			name: "wire",
			type: "WIRE",
			label: "wire",
		},
		{
			name: "mode",
			type: "SELECT",
			label: "Mode",
			options: [
				{
					value: "READ",
					label: "Read",
				},
				{
					value: "EDIT",
					label: "Edit",
				},
			],
		},
		{
			name: "pagesize",
			type: "TEXT",
			label: "Page size",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	handleFieldDrop: (dragNode, dropNode, dropIndex) => {
		const [metadataType, metadataItem] =
			component.path.getFullPathParts(dragNode)


		if (metadataType === "field") {
			const [, , fieldNamespace, fieldName] =
				component.path.parseFieldKey(metadataItem)
			uesio.builder.addDefinition(
				dropNode + '["columns"]',
				{
					field: `${fieldNamespace}.${fieldName}`,
				},
				dropIndex
			)
		}
	},
	type: "component",
	classes: ["root"],
	category: "DATA",
}
*/

export default Table
