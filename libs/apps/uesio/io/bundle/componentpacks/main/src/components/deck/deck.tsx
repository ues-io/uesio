import { styles, definition } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"
import { GridDefinition } from "../grid/grid"
import { default as IOGrid } from "../../utilities/grid/grid"

type DeckDefinition = GridDefinition & ListDefinition

const Deck: definition.UC<DeckDefinition> = (props) => {
	const { definition, context } = props
	const gridCols = styles.getResponsiveStyles(
		"gridTemplateColumns",
		definition.templateColumns
	)
	const gridRows = styles.getResponsiveStyles(
		"gridTemplateRows",
		definition.templateRows
	)

	const columnGap = definition.columnGap && {
		gridColumnGap: definition.columnGap,
	}

	const rowGap = definition.rowGap && {
		gridRowGap: definition.rowGap,
	}

	const gap = definition.gap && {
		gridGap: definition.gap,
	}

	const classes = styles.useStyles(
		{
			root: {
				...gridCols,
				...gridRows,
				...columnGap,
				...rowGap,
				...gap,
			},
		},
		props
	)
	return (
		<IOGrid
			variant={definition["uesio.variant"]}
			classes={classes}
			context={context}
		>
			<List {...props} />
		</IOGrid>
	)
}

/*
const DeckPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Deck",
	description:
		"Iterate over records in a wire and render content into a grid layout.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "id",
			type: "TEXT",
			label: "id",
		},
		{
			name: "wire",
			type: "WIRE",
			label: "wire",
		},
		{
			name: "mode",
			type: "SELECT",
			label: "Mode",
			options: [
				{
					value: "READ",
					label: "Read",
				},
				{
					value: "EDIT",
					label: "Edit",
				},
			],
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	classes: ["root"],
	category: "DATA",
}
*/

export default Deck
