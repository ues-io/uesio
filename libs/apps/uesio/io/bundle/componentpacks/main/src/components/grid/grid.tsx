import { component, styles, definition } from "@uesio/ui"
import { default as IOGrid } from "../../utilities/grid/grid"

type GridDefinition = {
	templateColumns?: styles.ResponsiveDefinition
	templateRows?: styles.ResponsiveDefinition
	templateAreas?: styles.ResponsiveDefinition
	columnGap?: string
	rowGap?: string
	gap?: string
}

const Grid: definition.UC<GridDefinition> = (props) => {
	const { definition, context } = props
	const gridCols = styles.getResponsiveStyles(
		"gridTemplateColumns",
		definition.templateColumns
	)
	const gridRows = styles.getResponsiveStyles(
		"gridTemplateRows",
		definition.templateRows
	)

	const gridAreas = styles.getResponsiveStyles(
		"gridTemplateAreas",
		definition.templateAreas
	)

	const columnGap = definition.columnGap && {
		gridColumnGap: definition.columnGap,
	}

	const rowGap = definition.rowGap && {
		gridRowGap: definition.rowGap,
	}

	const classes = styles.useStyles(
		{
			root: {
				...gridCols,
				...gridRows,
				...gridAreas,
				...columnGap,
				...rowGap,
			},
		},
		props
	)
	return (
		<IOGrid classes={classes} context={props.context}>
			<component.Slot
				definition={definition}
				listName="items"
				path={props.path}
				accepts={[
					"uesio/io.griditem",
					"uesio.standalone",
					"uesio.field",
				]}
				context={context}
			/>
		</IOGrid>
	)
}

/*

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
	handleFieldDrop: (dragNode, dropNode, dropIndex) => {
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
*/

Grid.displayName = "Grid"

export { GridDefinition }

export default Grid
