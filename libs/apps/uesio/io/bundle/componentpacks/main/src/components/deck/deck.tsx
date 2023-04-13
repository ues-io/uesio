import { styles, definition } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"
import { GridDefinition } from "../grid/grid"
import { default as IOGrid } from "../../utilities/grid/grid"

type DeckDefinition = GridDefinition & ListDefinition

const Deck: definition.UC<DeckDefinition> = (props) => {
	const { definition, context } = props

	// TODO: REMOVE THESE STYLING PROPERTIES
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
	// END TODO

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

export default Deck
