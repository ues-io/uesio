import { definition, builder } from "@uesio/ui"

interface TabsDefinition extends definition.BaseDefinition {
	id?: string
	tabs: { id: string; label: string; components: definition.DefinitionList }[]
	footer: definition.DefinitionList
}

interface Props extends definition.BaseProps {
	definition: TabsDefinition
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
export { Props, TabsDefinition }

export default PropertyDefinition
