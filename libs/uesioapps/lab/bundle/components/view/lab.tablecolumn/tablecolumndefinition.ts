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
	width: string
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
		verticalAlignment: "center",
	}),
	properties: [
		{
			name: "name",
			type: "TEXT",
			label: "Name",
		},
		{
			name: "width",
			type: "TEXT",
			label: "Width",
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
							value: "start",
							label: "Top",
						},
						{
							value: "center",
							label: "Center",
						},
						{
							value: "end",
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
