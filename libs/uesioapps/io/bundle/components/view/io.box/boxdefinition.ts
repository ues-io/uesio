import { definition, builder, signal } from "@uesio/ui"

type BoxDefinition = {
	signals?: signal.SignalDefinition[]
}

interface BoxProps extends definition.BaseProps {
	definition: BoxDefinition
}

const BoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Box",
	tooltip: "Used for grouping elements",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
}
export { BoxProps, BoxDefinition }

export default BoxPropertyDefinition
