import { FunctionComponent } from "react"

import { component, styles } from "@uesio/ui"
import { DeckProps } from "./deckdefinition"
import List from "../list/list"

const IOGrid = component.registry.getUtility("uesio/io.grid")

const Deck: FunctionComponent<DeckProps> = (props) => {
	const { definition, context } = props
	const gridCols = styles.getResponsiveStyles(
		"gridTemplateColumns",
		definition.templateColumns,
		context
	)
	const gridRows = styles.getResponsiveStyles(
		"gridTemplateRows",
		definition.templateRows,
		context
	)

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
