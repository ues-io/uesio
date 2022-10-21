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
					label: "Equals",
					value: "EQ",
				},
				{
					label: "Not Equal To",
					value: "NOT_EQ",
				},
				{
					label: "Greater Than",
					value: "GT",
				},
				{
					label: "Less Than",
					value: "LT",
				},
				{
					label: "Greater Than or Equal To",
					value: "GTE",
				},
				{
					label: "Less Than or Equal To",
					value: "LTE",
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
