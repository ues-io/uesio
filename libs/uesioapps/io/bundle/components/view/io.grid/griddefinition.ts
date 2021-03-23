import { definition, builder, styles } from "@uesio/ui"

type GridDefinition = {
	templateColumns?: styles.ResponsiveDefinition
} & definition.BaseDefinition

interface GridProps extends definition.BaseProps {
	definition: GridDefinition
}

const GridPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Grid",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export { GridProps, GridDefinition }

export default GridPropertyDefinition
