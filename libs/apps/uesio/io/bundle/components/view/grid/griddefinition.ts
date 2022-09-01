import { definition, builder, styles, component } from "@uesio/ui"

type GridDefinition = {
	templateColumns?: styles.ResponsiveDefinition
	templateRows?: styles.ResponsiveDefinition
	templateAreas?: styles.ResponsiveDefinition
	columnGap?: string
	rowGap?: string
	gap?: string
}

interface GridProps extends definition.BaseProps {
	definition: GridDefinition
}

const GridPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Grid",
	description:
		"Layout areas of your page using low-level CSS grid functionality.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "templateColumns",
			type: "TEXT",
			label: "Template Columns",
		},
		{
			name: "columnGap",
			type: "TEXT",
			label: "Column Gap",
		},
		{
			name: "templateRows",
			type: "TEXT",
			label: "Template Rows",
		},
		{
			name: "rowGap",
			type: "TEXT",
			label: "Row Gap",
		},
	],
	sections: [],
	actions: [],
	classes: ["root"],
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
	category: "LAYOUT",
}
export { GridProps, GridDefinition }

export default GridPropertyDefinition
