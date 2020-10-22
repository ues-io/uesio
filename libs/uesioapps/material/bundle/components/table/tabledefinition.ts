import { definition, builder, hooks } from "uesio"

type TableMode = "READ" | "EDIT"

type TableDefinition = {
	id: string
	wire: string
	mode: TableMode
	columns: definition.DefinitionList
}

type TableState = {
	mode: TableMode
}

type ColumnDefinition = {
	field: string
	label: string
	components: definition.DefinitionList
}

interface TableProps extends definition.BaseProps {
	definition: TableDefinition
}

const TablePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Table",
	defaultDefinition: () => ({
		id: "NEW_TABLE",
		wire: null,
		mode: "READ",
		columns: [],
	}),
	properties: [
		{
			name: "mode",
			type: "SELECT",
			label: "Mode",
			options: [
				{
					value: "EDIT",
					label: "Edit",
				},
				{
					value: "READ",
					label: "Read",
				},
			],
		},
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
	],
	sections: [],
	traits: ["uesio.standalone"],
	handleFieldDrop: (
		dragNode: string,
		dropNode: string,
		dropIndex: number,
		propDef: builder.BuildPropertiesDefinition,
		uesio: hooks.Uesio
	) => {
		uesio.view.addDefinition(
			dropNode,
			{
				["material.column"]: {
					field: propDef.namespace + "." + propDef.name,
				},
			},
			dropIndex
		)
	},
}

export { ColumnDefinition, TableDefinition, TableMode, TableState, TableProps }

export default TablePropertyDefinition
