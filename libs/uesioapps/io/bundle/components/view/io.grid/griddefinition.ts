import { definition, builder, styles } from "@uesio/ui"

type GridDefinition = {
	templateColumns?: styles.ResponsiveDefinition
	templateRows?: styles.ResponsiveDefinition
	templateAreas?: styles.ResponsiveDefinition
	columnGap?: string
}

interface GridProps extends definition.BaseProps {
	definition: GridDefinition
}

const GridPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Grid",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "columnGap",
			type: "TEXT",
			label: "Column Gap",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	handleFieldDrop: (dragNode, dropNode, dropIndex, propDef, uesio) => {
		uesio.view.addDefinition(
			dropNode,
			{
				"io.field": {
					fieldId: `${propDef.namespace}.${propDef.name}`,
				},
			},
			dropIndex,
			true
		)
	},
}
export { GridProps, GridDefinition }

export default GridPropertyDefinition
