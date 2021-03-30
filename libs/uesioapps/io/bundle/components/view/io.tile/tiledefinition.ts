import { definition, builder, signal } from "@uesio/ui"

type TileDefinition = {
	signals?: signal.SignalDefinition[]
} & definition.BaseDefinition

interface TileProps extends definition.BaseProps {
	definition: TileDefinition
}

const TilePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Tile",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export { TileProps, TileDefinition }

export default TilePropertyDefinition
