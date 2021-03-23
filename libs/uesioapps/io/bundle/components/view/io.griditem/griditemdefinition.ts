import { definition, builder } from "@uesio/ui"

type GridItemDefinition = {
	column: string
}

interface GridItemProps extends definition.BaseProps {
	definition: GridItemDefinition
}

const GridItemPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Grid Item",
	defaultDefinition: () => ({
		components: [],
	}),
	sections: [],
}
export { GridItemProps, GridItemDefinition }

export default GridItemPropertyDefinition
