import { api, component, definition, metadata, styles } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"

import { default as IOGrid } from "../../utilities/grid/grid"

const StyleDefaults = Object.freeze({
	root: [],
})

type DeckDefinition = {
	gridVariant?: metadata.MetadataKey
} & ListDefinition

const Deck: definition.UC<DeckDefinition> = (props) => {
	const { definition, context } = props
	// Backwards compatibility: Prior to 1/1/2024, "gridVariant" didn't exist,
	// and the "uesio.variant" property was expected to be a Grid variant.
	const { gridVariant = definition[component.STYLE_VARIANT] } = definition
	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IOGrid
			variant={gridVariant}
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
