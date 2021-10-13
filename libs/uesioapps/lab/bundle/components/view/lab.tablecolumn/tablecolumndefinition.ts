import { definition, builder } from "@uesio/ui"

type TableColumnDefinition = {
	name?: string
	components: {
		[key: string]: {
			[key: string]: definition.Definition
		}
	}[]
	verticalAlignment?: "top" | "center" | "bottom"
	horizontalAlignment?: "left" | "center" | "right"
	id?: string
	order?: number
}
interface TableColumnProps extends definition.BaseProps {
	definition: TableColumnDefinition
	style?: any
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
	sections: [
		{
			title: "Cell Options",
			type: "PROPLIST",
			properties: [
				{
					label: "Vertical Alignment",
					type: "SELECT",
					name: "verticalAlignment",
					options: [
						{
							value: "top",
							label: "Top",
						},
						{
							value: "center",
							label: "Center",
						},
						{
							value: "bottom",
							label: "Bottom",
						},
					],
				},
			],
		},
	],
	actions: [],
	type: "component",
	traits: ["uesio.tablecolumn", "uesio.standalone"],
}
export { TableColumnProps, TableColumnDefinition }

export default TableColumnPropertyDefinition
