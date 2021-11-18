import { definition, builder, context } from "@uesio/ui"

type ListDefinition = {
	id: string
	wire: string
	mode: context.FieldMode
}

interface ListProps extends definition.BaseProps {
	definition: ListDefinition
}

const ListPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "List",
	description: "List",
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
	traits: ["uesio.standalone"],
	type: "component",
	classes: ["root"],
}
export { ListProps, ListDefinition }

export default ListPropertyDefinition
