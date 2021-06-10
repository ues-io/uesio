import { definition, builder, signal } from "@uesio/ui"

type TableMode = "READ" | "EDIT"

type TableClasses = Record<
	"root" | "table" | "headerCell" | "header" | "cell" | "row" | "rowDeleted",
	string
>

type TableState = {
	mode: TableMode
}

type TableDefinition = {
	id: string
	wire: string
	mode: TableMode
	columns: definition.DefinitionList
	rowactions: RowAction[]
}

interface TableProps extends definition.BaseProps {
	definition: TableDefinition
}

type RowAction = {
	text: string
	signals: signal.SignalDefinition[]
}

type ColumnDefinition = {
	field: string
	label: string
	components: definition.DefinitionList
}

const TablePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Table",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export {
	TableProps,
	TableState,
	TableDefinition,
	ColumnDefinition,
	TableClasses,
	RowAction,
}

export default TablePropertyDefinition
