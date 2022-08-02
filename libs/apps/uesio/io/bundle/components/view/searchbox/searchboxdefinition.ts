import { definition, builder, metadata } from "@uesio/ui"

type SearchBoxDefinition = {
	placeholder?: string
	wire: string
	searchFields: metadata.MetadataKey[]
} & definition.BaseDefinition

interface SearchBoxProps extends definition.BaseProps {
	definition: SearchBoxDefinition
}

const SearchBoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Search Box",
	description: "Searches for stuff",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "searchFields",
			type: "WIRE_FIELDS",
			label: "Search Fields",
		},
		{
			name: "placeholder",
			type: "TEXT",
			label: "Placeholder",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { SearchBoxProps, SearchBoxDefinition }

export default SearchBoxPropertyDefinition
