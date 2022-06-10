import { definition, builder } from "@uesio/ui"

type SearchBoxDefinition = {
	placeholder?: string
	wire: string
} & definition.BaseDefinition

interface SearchBoxProps extends definition.BaseProps {
	definition: SearchBoxDefinition
}

const SearchBoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Search Box",
	description: "Searches for stuff",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { SearchBoxProps, SearchBoxDefinition }

export default SearchBoxPropertyDefinition
