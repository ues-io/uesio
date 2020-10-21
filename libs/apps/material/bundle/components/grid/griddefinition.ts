import { definition, builder, styles, material } from "uesio"
import GridItemPropertyDefinition from "../griditem/griditemdefinition"

type GridDefinition = {
	items: definition.DefinitionList
	height: string
	background: styles.BackgroundDefinition
	justify: material.GridJustification
	direction: material.GridDirection
	alignitems: material.GridItemsAlignment
	spacing: material.GridSpacing
}

interface GridProps extends definition.BaseProps {
	definition: GridDefinition
}

const GridPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		buttons: [
			{
				"material.griditem": GridItemPropertyDefinition.defaultDefinition(),
			},
		],
	}),
	title: "Grid",
	sections: [],
	traits: ["uesio.standalone"],
}
export { GridProps, GridDefinition }

export default GridPropertyDefinition
