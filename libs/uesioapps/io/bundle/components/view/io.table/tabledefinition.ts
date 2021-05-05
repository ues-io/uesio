import { definition, builder } from "@uesio/ui"

type TableMode = "READ" | "EDIT"

type TableState = {
	mode: TableMode
}

type TableDefinition = {
	id: string
	wire: string
	mode: TableMode
	columns: definition.DefinitionList
}

interface TableProps extends definition.BaseProps {
	definition: TableDefinition
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
export { TableProps, TableState, TableDefinition, ColumnDefinition }

export default TablePropertyDefinition
