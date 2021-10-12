import { definition, builder } from "@uesio/ui"

type TableColumnDefinition = {
	name: string
	items: any
	components: any[]
	order: number
	field: string
}
interface TableColumnProps extends definition.BaseProps {
	definition: TableColumnDefinition
}

const TableColumnPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Column",
	description: "Table Column",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		components: [],
	}),
	properties: [
		{
			name: "name",
			type: "TEXT",
			label: "Name",
		},
		{
			name: "field",
			type: "TEXT",
			label: "Wire Field",
		},
	],
	sections: [],
	actions: [],
	type: "component",
	traits: ["uesio.tablecolumn", "uesio.standalone"],
}
export { TableColumnProps, TableColumnDefinition }

export default TableColumnPropertyDefinition
