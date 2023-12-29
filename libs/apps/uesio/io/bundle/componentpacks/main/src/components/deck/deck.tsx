import { api, definition, metadata, styles } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"

import { default as IOGrid } from "../../utilities/grid/grid"

const StyleDefaults = Object.freeze({
	root: [],
})

type DeckDefinition = {
	gridVariant?: metadata.MetadataType
} & ListDefinition

const Deck: definition.UC<DeckDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IOGrid
			variant={definition.gridVariant}
			classes={classes}
			context={context}
			id={api.component.getComponentIdFromProps(props)}
		>
			<List {...props} />
		</IOGrid>
	)
}
Deck.signals = List.signals

export default Deck
