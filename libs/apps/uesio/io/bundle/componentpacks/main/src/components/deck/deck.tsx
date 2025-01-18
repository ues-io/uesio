import { api, component, definition, metadata } from "@uesio/ui"
import List, { ListDefinition } from "../list/list"

import { default as IOGrid } from "../../utilities/grid/grid"

type DeckDefinition = {
  gridVariant?: metadata.MetadataKey
  emptyState?: definition.DefinitionList
} & ListDefinition

const Deck: definition.UC<DeckDefinition> = (props) => {
  const { definition, context } = props
  // Backwards compatibility: Prior to 1/1/2024, "gridVariant" didn't exist,
  // and the "uesio.variant" property was expected to be a Grid variant.
  const { gridVariant = definition[component.STYLE_VARIANT] } = definition

  return (
    <IOGrid
      variant={gridVariant}
      styleTokens={definition[component.STYLE_TOKENS]}
      context={context}
      id={api.component.getComponentIdFromProps(props)}
    >
      <List {...props} />
    </IOGrid>
  )
}
Deck.signals = List.signals

export default Deck
