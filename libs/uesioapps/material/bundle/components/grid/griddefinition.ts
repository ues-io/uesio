import { definition, builder, styles } from "@uesio/ui"
import GridItemPropertyDefinition from "../griditem/griditemdefinition"
import * as material from "@material-ui/core"

type GridDefinition = {
	components: definition.DefinitionList
	height: number
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
		items: [
			{
				"material.griditem": GridItemPropertyDefinition.defaultDefinition(),
			},
		],
	}),
	title: "Grid",
	properties: [
		{
			name: "justify",
			type: "SELECT",
			label: "Justify",
			options: [
				{
					value: "flex-start",
					label: "flex-start",
				},
				{
					value: "center",
					label: "center",
				},
				{
					value: "flex-end",
					label: "flex-end",
				},
				{
					value: "space-between",
					label: "space-between",
				},
				{
					value: "space-around",
					label: "space-around",
				},
				{
					value: "space-evenly",
					label: "space-evenly",
				},
			],
		},
		{
			name: "direction",
			type: "SELECT",
			label: "Direction",
			options: [
				{
					value: "row",
					label: "row",
				},
				{
					value: "row-reverse",
					label: "row-reverse",
				},
				{
					value: "column",
					label: "column",
				},
				{
					value: "column-reverse",
					label: "column-reverse",
				},
			],
		},
		{
			name: "alignitems",
			type: "SELECT",
			label: "Align items",
			options: [
				{
					value: "flex-start",
					label: "flex-start",
				},
				{
					value: "center",
					label: "center",
				},
				{
					value: "flex-end",
					label: "flex-end",
				},
				{
					value: "stretch",
					label: "stretch",
				},
				{
					value: "baseline",
					label: "baseline",
				},
			],
		},
		{
			name: "spacing",
			type: "NUMBER",
			label: "Spacing",
		},
	],
	sections: [],
	traits: ["uesio.standalone"],
	actions: [
		{
			label: "Add Item",
			type: "ADD",
			componentKey: "material.griditem",
			slot: "items",
		},
	],
}
export { GridProps, GridDefinition }

export default GridPropertyDefinition
