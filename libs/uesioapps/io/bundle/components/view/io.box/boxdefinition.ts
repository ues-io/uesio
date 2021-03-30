import { definition, builder, signal } from "@uesio/ui"

type BoxDefinition = {
	signals?: signal.SignalDefinition[]
} & definition.BaseDefinition

interface BoxProps extends definition.BaseProps {
	definition: BoxDefinition
}

const BoxPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Box",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export { BoxProps, BoxDefinition }

export default BoxPropertyDefinition
