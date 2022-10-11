import { definition, builder } from "@uesio/ui"
import { FilterProps } from "../filter/filterdefinition"
interface NumberRangeFilter {
	point: "range"
	minLabel: string
	maxLabel: string
}
interface NumberPointFilter {
	point: "point"
}

type NumberOptions = NumberRangeFilter | NumberPointFilter
type Definition = NumberOptions &
	definition.BaseDefinition & {
		slider: boolean
		input: boolean
	}

type Props = {
	definition: Definition
} & definition.BaseProps &
	FilterProps

const Propdef: builder.BuildPropertiesDefinition = {
	title: "Number filter",
	description: "Just a filter for a number",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "point",
			type: "SELECT",
			label: "Point",
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

export { Props, Definition }

export default Propdef
