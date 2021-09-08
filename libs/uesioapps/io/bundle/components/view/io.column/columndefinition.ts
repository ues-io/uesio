import { definition, builder, signal } from "@uesio/ui"
type ColumnDefinition = {
	flexRatio: string | number
	minWidth: number
}

interface ColumnProps extends definition.BaseProps {
	definition: ColumnDefinition
}

const ColumnPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Column",
	description: "Visible impression obtained by a camera",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		flexRatio: 1,
	}),

	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [
				{
					name: "flexRatio",
					type: "TEXT",
					label: "flex",
				},
				{
					name: "minWidth",
					type: "NUMBER",
					label: "minWidth",
				},
			],
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { ColumnProps }

export default ColumnPropertyDefinition
