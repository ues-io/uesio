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
import { setEditMode, setReadMode, toggleMode } from "../../shared/mode"
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
import drawerSignals from "./drawersignals"
import { default as IOTable } from "../../utilities/table/table"

import {
	NumberFieldOptions,
	ReferenceFieldOptions,
	LongTextFieldOptions,
	UserFieldOptions,
	ApplyChanges,
} from "../field/field"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import { MetadataFieldOptions } from "../../utilities/field/metadata"

type TableDefinition = {
	wire: string
	mode: context.FieldMode
	columns: ColumnDefinition[]
	drawer: definition.DefinitionList
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
	[component.DISPLAY_CONDITIONS]?: component.DisplayCondition[]
}

type ColumnDefinition = {
	field: string
	displayAs?: string
	label: string
	width?: string
	applyChanges?: ApplyChanges
	applyDelay?: number
	reference?: ReferenceFieldOptions
	user?: UserFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	metadata?: MetadataFieldOptions
	readonly?: boolean
	components: definition.DefinitionList
	[component.COMPONENT_CONTEXT]?: definition.DefinitionMap
} & definition.BaseDefinition

type RecordContext = component.ItemContext<wire.WireRecord>

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE_MODE: toggleMode,
	SET_EDIT_MODE: setEditMode,
	SET_READ_MODE: setReadMode,
	NEXT_PAGE: nextPage,
	PREV_PAGE: prevPage,
	...drawerSignals,
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Table: definition.UC<TableDefinition> = (props) => {
	const { path, context, definition, componentType } = props
	const wire = api.wire.useWire(definition.wire, context)
	const componentId = api.component.getComponentIdFromProps(props)
	const [mode] = api.component.useMode(componentId, definition.mode)

	// If we got a wire from the definition, add it to context
	let newContext = context
	if (definition.wire && wire) {
		newContext = newContext.addWireFrame({
			wire: definition.wire,
			view: wire.getViewId(),
		})
	}
	if (mode) {
		newContext = newContext.addFieldModeFrame(mode)
	}

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
		(record, context) => {
			if (record && wire) {
				context = context.addRecordFrame({
					wire: definition.wire,
					record: record.getId(),
					view: wire.getViewId(),
				})
			}
			if (mode) {
				context = context.addFieldModeFrame(mode)
			}
			return context
		},
		newContext
	)

	const [selected, setSelected] = api.component.useStateSlice<
		Record<string, boolean>
	>("selected", componentId, {})

	const [openDrawers] = api.component.useStateSlice<Record<string, boolean>>(
		"drawerState",
		componentId,
		{}
	)

	if (!wire || !mode || !path || currentPage === undefined) return null

	const classes = styles.useStyleTokens(StyleDefaults, props)

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
				<FieldWrapper context={context} variant="uesio/io.table">
					<Group context={recordContext.context}>
						{otherActions
							.filter((action) =>
								component.shouldAll(
									action[component.DISPLAY_CONDITIONS],
									recordContext.context
								)
							)
							.map((action, i) => {
								const handler = api.signal.getHandler(
									// Don't run row action signals in View Builder
									context.getCustomSlotLoader()
										? []
										: action.signals,
									recordContext.context
								)
								return (
									<Button
										key={action.text + i}
										variant="uesio/io.rowaction"
										className="rowaction"
										label={action.text}
										context={recordContext.context}
										onClick={handler}
									/>
								)
							})}
					</Group>
				</FieldWrapper>
		  )
		: undefined

	const isRowOpenFunc = definition.drawer
		? (recordContext: RecordContext) =>
				!!openDrawers?.[recordContext.item.getId()]
		: undefined

	const drawerRendererFunc = definition.drawer
		? (recordContext: RecordContext) => (
				<component.Slot
					definition={definition}
					componentType={componentType}
					listName="drawer"
					path={`${path}["drawer"]`}
					context={recordContext.context}
				/>
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
						getItemKey={(item: ColumnDefinition) => item.label}
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
				componentType={componentType}
				listName="components"
				{...sharedProps}
			/>
		) : (
			<component.Component
				componentType="uesio/io.field"
				definition={{
					...column,
					fieldId: column.field,
					labelPosition: "none",
					wrapperVariant: "uesio/io.table",
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
				id={api.component.getComponentIdFromProps(props)}
				variant={definition[component.STYLE_VARIANT]}
				rows={paginated}
				columns={columnsToDisplay?.map((column) => ({
					...column,
					label: context.mergeString(column.label),
				}))}
				context={context}
				classes={classes}
				rowNumberFunc={
					definition.rownumbers
						? (index: number) => pageSize * currentPage + index + ""
						: undefined
				}
				defaultActionFunc={defaultActionsFunc}
				rowActionsFunc={rowActionsFunc}
				drawerRendererFunc={drawerRendererFunc}
				columnHeaderFunc={columnHeaderFunc}
				columnMenuFunc={columnMenuFunc}
				cellFunc={cellFunc}
				isDeletedFunc={isDeletedFunc}
				isRowExpandedFunc={isRowOpenFunc}
				isSelectedFunc={isSelectedFunc}
				onSelectChange={onSelectChange}
				onAllSelectChange={onAllSelectChange}
				isAllSelectedFunc={isAllSelectedFunc}
			/>
			{((pageSize > 0 && maxPages > 1) || wire.hasMore()) && (
				<Paginator
					id={`${componentId}-pagination`}
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
