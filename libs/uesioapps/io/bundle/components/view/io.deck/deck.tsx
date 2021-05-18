import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { DeckProps } from "./deckdefinition"
import List from "../io.list/list"

const IOGrid = component.registry.getUtility("io.grid")

const Deck: FunctionComponent<DeckProps> = (props) => {
	const { definition, context } = props
	const gridCols =
		definition.templateColumns &&
		styles.getResponsiveStyles(
			"gridTemplateColumns",
			definition.templateColumns
		)
	const gridRows =
		definition.templateRows &&
		styles.getResponsiveStyles("gridTemplateRows", definition.templateRows)

	const classes = styles.useStyles(
		{
			root: {
				...gridCols,
				...gridRows,
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
