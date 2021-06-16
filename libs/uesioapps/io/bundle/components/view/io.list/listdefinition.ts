import { definition, builder } from "@uesio/ui"

type ListMode = "READ" | "EDIT"

type ListState = {
	mode: ListMode
}

type ListDefinition = {
	id: string
	wire: string
	mode: ListMode
}

interface ListProps extends definition.BaseProps {
	definition: ListDefinition
}

const ListPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "List",
	defaultDefinition: () => ({ wire: "", mode: "READ" }),
	properties: [
		{
			name: "wire",
			type: "TEXT",
			label: "Wire",
		},
		{
			name: "mode",
			type: "TEXT",
			label: "Mode",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
}
export { ListProps, ListState, ListDefinition }

export default ListPropertyDefinition
