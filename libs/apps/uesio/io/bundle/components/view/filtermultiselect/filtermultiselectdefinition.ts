import { definition, builder } from "@uesio/ui"
import { FilterProps } from "../filter/filterdefinition"

type Props = {
	definition: {
		wire: string
		field: string
	}
} & definition.BaseProps &
	FilterProps

const Propdef: builder.BuildPropertiesDefinition = {
	title: "Number filter",
	description: "Just a filter for a number",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "operator",
			type: "SELECT",
			label: "Operator",
			options: [
				{
					label: "",
					value: "",
				},
				{
					label: "Has Any",
					value: "HAS_ANY",
				},
				{
					label: "Has All",
					value: "HAS_ALL",
				},
			],
		},
	],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}

export { Props }

export default Propdef
