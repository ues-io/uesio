import { definition, builder } from "@uesio/ui"
import { GridDefinition } from "../io.grid/griddefinition"
import { ListDefinition } from "../io.list/listdefinition"

type DeckDefinition = GridDefinition &
	ListDefinition &
	definition.BaseDefinition

interface DeckProps extends definition.BaseProps {
	definition: DeckDefinition
}

const DeckPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Deck",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export { DeckProps, DeckDefinition }

export default DeckPropertyDefinition
