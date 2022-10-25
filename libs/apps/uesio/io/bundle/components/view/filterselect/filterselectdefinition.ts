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
	title: "Select filter",
	description: "Just a filter for a selectfield",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}

export { Props }

export default Propdef
