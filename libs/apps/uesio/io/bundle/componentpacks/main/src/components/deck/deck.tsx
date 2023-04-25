import { styles, definition } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"

import { default as IOGrid } from "../../utilities/grid/grid"

const Deck: definition.UC<ListDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
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
