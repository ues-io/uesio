import { definition, builder } from "@uesio/ui"

type ColumnDefinition = {
	flexRatio: string | number
	minWidth: number
	order: number
}

interface ColumnProps extends definition.BaseProps {
	definition: ColumnDefinition
}

const ColumnPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Column",
	description: "Visible impression obtained by a camera",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	sections: [],
	traits: [],
	classes: ["root"],
	type: "component",
	actions: [],
}
export { ColumnProps }

export default ColumnPropertyDefinition
