import { definition, builder, wire } from "@uesio/ui"
import FilterProperties from "./filterProperties"
type FilterDefinition = {
	field: string
	wire: string
} & definition.BaseDefinition

interface FilterProps extends definition.BaseProps {
	definition: FilterDefinition
	wire: wire.Wire
}

const FilterPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Filter",
	description: "Just a Filter",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "wire",
			type: "WIRE",
			label: "Wire",
		},
		{
			name: "field",
			type: "FIELD",
			label: "Field",
			wireField: "wire",
		},

		{
			type: "CUSTOM",
			renderFunc: FilterProperties,
			name: "custom",
			label: "Custom",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	category: "DATA",
	type: "component",
	classes: ["root"],
}

export { FilterProps, FilterDefinition }

export default FilterPropertyDefinition
