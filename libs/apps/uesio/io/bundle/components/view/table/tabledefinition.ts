import { definition, builder, signal, component, context } from "@uesio/ui"

interface TableDefinition extends definition.BaseDefinition {
	id: string
	wire: string
	mode: context.FieldMode
	columns: ColumnDefinition[]
	rowactions?: RowAction[]
	rownumbers: boolean
	pagesize: string
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
			label: "Wire",
		},
		{
			name: "rownumbers",
			type: "BOOLEAN",
			label: "Show Row Numbers",
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
		{
			type: "PROPLISTS",
			name: "rowactions",
			properties: [
				{
					type: "TEXT",
					label: "Text",
					name: "text",
				},
			],
			nameTemplate: "action",
			label: "Row Actions",
		},
	],
	sections: [
		{
			type: "PROPLISTS",
			name: "columns",
			title: "Columns",

			properties: [
				{
					type: "FIELD",
					wireField: "./../../../wire",
					label: "Field",
					name: "field",
				},
			],
			nameTemplate: "column ${field}",
			nameFallback: "column",
		},
		{
			type: "PROPLISTS",
			name: "rowactions",
			title: "Row actions",
			properties: [
				{
					type: "TEXT",
					label: "Text",
					name: "text",
				},
			],
			nameTemplate: "row action ${field}",
			nameFallback: "row action",
		},
	],
	actions: [],
	accepts: ["uesio.field"],
	traits: ["uesio.standalone"],
	handleFieldDrop: (dragNode, dropNode, dropIndex, propDef, uesio) => {
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
export { TableProps, TableDefinition, ColumnDefinition, RowAction }

export default TablePropertyDefinition
