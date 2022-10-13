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
			name: "type",
			type: "SELECT",
			label: "Type",
			options: [
				{ label: "Single point", value: "point" },
				{ label: "Range", value: "range" },
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
