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
	],
	sections: [],
	actions: [],
	accepts: ["uesio.field"],
	traits: ["uesio.standalone"],
	handleFieldDrop: (dragNode, dropNode, dropIndex, propDef, uesio) => {
		uesio.view.addDefinition(
			dropNode + '["columns"]',
			{
				"io.column": {
					field: `${propDef.namespace}.${propDef.name}`,
				},
			},
			dropIndex,
			true
		)
	},
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
