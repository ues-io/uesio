import { definition, builder, signal } from "@uesio/ui"

type Definition = {
	signals?: signal.SignalDefinition[]
	"uesio.variant": string
	tabs: { id: string; label: string; components: definition.DefinitionList }[]
}

interface Props extends definition.BaseProps {
	definition: Definition
}

const PropertyDefinition: builder.BuildPropertiesDefinition = {
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
}
export { Props, Definition }

export default PropertyDefinition
