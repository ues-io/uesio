import { definition, builder, signal } from "@uesio/ui"

type BoxDefinition = {
	signals?: signal.SignalDefinition[]
}

interface BoxProps extends definition.BaseProps {
	definition: BoxDefinition
}

const BoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Box",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "wire",
			type: "WIRE",
			label: "wire",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { BoxProps, BoxDefinition }

export default BoxPropertyDefinition
