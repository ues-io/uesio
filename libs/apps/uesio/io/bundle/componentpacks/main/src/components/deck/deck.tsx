import { FunctionComponent } from "react"

import { component, styles, definition } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"
import { GridDefinition } from "../grid/grid"

type DeckDefinition = GridDefinition &
	ListDefinition &
	definition.BaseDefinition

interface DeckProps extends definition.BaseProps {
	definition: DeckDefinition
}

const IOGrid = component.getUtility("uesio/io.grid")

const Deck: FunctionComponent<DeckProps> = (props) => {
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
