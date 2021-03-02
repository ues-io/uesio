import { definition, builder } from "@uesio/ui"

type ColumnDefinition = {
	components?: definition.DefinitionList
	field?: string
}

interface ColumnProps extends definition.BaseProps {
	definition: ColumnDefinition
}

const ColumnPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({}),
	title: "Column",
	sections: [],
	traits: [],
}
export { ColumnProps, ColumnDefinition }

export default ColumnPropertyDefinition
