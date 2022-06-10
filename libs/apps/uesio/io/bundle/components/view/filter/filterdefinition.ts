import { definition, builder } from "@uesio/ui"

type FilterDefinition = {
	fieldId: string
	wire: string
} & definition.BaseDefinition

interface FilterProps extends definition.BaseProps {
	definition: FilterDefinition
}

const FilterPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Filter",
	description: "Just a Filter",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}

export { FilterProps, FilterDefinition }

export default FilterPropertyDefinition
