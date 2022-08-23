import { definition, builder, signal } from "@uesio/ui"

type BoxDefinition = {
	signals?: signal.SignalDefinition[]
}

interface BoxProps extends definition.BaseProps {
	definition: BoxDefinition
}

const BoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Box",
	description: "Used for grouping elements",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "LAYOUT",
}
export { BoxProps, BoxDefinition }

export default BoxPropertyDefinition
