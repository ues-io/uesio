import { definition, builder, signal, component, context } from "@uesio/ui"

interface TableDefinition extends definition.BaseDefinition {
	id: string
	wire: string
	mode: context.FieldMode
	columns: definition.DefinitionList
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
	description: "Table",
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
					"uesio/io.column": {
						field: `${fieldNamespace}.${fieldName}`,
					},
				},
				dropIndex
			)
		}
	},
	type: "component",
	classes: ["root"],
}
export { TableProps, TableDefinition, ColumnDefinition, RowAction }

export default TablePropertyDefinition
