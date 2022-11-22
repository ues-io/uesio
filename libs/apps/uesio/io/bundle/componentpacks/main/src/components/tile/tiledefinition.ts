import { definition, builder, signal } from "@uesio/ui"

type TileDefinition = {
	signals?: signal.SignalDefinition[]
	avatar?: definition.DefinitionList
	content?: definition.DefinitionList
} & definition.BaseDefinition

interface TileProps extends definition.BaseProps {
	definition: TileDefinition
}

const TilePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Tile",
	description: "A clickable tag representing a record.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	classes: ["root", "content", "avatar"],
	category: "CONTENT",
}
export { TileProps, TileDefinition }

export default TilePropertyDefinition
