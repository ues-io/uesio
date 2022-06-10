import { definition, builder } from "@uesio/ui"
import { GridDefinition } from "../grid/griddefinition"
import { ListDefinition } from "../list/listdefinition"

type DeckDefinition = GridDefinition &
	ListDefinition &
	definition.BaseDefinition

interface DeckProps extends definition.BaseProps {
	definition: DeckDefinition
}

const DeckPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Deck",
	description: "Deck",
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
}
export { DeckProps, DeckDefinition }

export default DeckPropertyDefinition
