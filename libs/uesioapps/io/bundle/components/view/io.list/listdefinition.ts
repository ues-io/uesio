import { definition, builder } from "@uesio/ui"

type ListDefinition = {
	id: string
	wire: string
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
export { ListProps, ListDefinition }

export default ListPropertyDefinition
