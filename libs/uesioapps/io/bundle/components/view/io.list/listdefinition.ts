import { definition, builder } from "@uesio/ui"

type ListMode = "READ" | "EDIT"

type ListState = {
	mode: ListMode
}

type ListDefinition = {
	id: string
	wire: string
	mode: ListMode
} & definition.BaseDefinition

interface ListProps extends definition.BaseProps {
	definition: ListDefinition
}

const ListPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "List",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export { ListProps, ListState, ListDefinition }

export default ListPropertyDefinition
