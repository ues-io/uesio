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
	description: "Filter a wire based on a user's text search.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
		{
			name: "searchFields",
			type: "WIRE_FIELDS",
			label: "Search Fields",
			wireField: "wire",
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
	category: "INTERACTION",
}
export { SearchBoxProps, SearchBoxDefinition }

export default SearchBoxPropertyDefinition
