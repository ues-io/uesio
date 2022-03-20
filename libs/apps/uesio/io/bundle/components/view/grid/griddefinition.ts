import { definition, builder, styles, component } from "@uesio/ui"

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
	description: "Grid",
	link: "https://docs.ues.io/",
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
		const [metadataType, metadataItem] =
			component.path.getFullPathParts(dragNode)
		if (metadataType === "field") {
			const [, , fieldNamespace, fieldName] =
				component.path.parseFieldKey(metadataItem)
			uesio.builder.addDefinition(
				dropNode,
				{
					"uesio/io.field": {
						fieldId: `${fieldNamespace}.${fieldName}`,
					},
				},
				dropIndex
			)
		}
	},
	type: "component",
}
export { GridProps, GridDefinition }

export default GridPropertyDefinition
