import { component, styles, definition } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"

import { default as IOGrid } from "../../utilities/grid/grid"

const StyleDefaults = Object.freeze({
	root: [],
})

const Deck: definition.UC<ListDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IOGrid
			variant={definition[component.STYLE_VARIANT]}
			classes={classes}
			context={context}
		>
			<List {...props} />
		</IOGrid>
	)
}
Deck.signals = List.signals

export default Deck
