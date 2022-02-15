import { definition, builder } from "@uesio/ui"

type NewComponentDefinition = {}

interface NewComponentProps extends definition.BaseProps {
	definition: NewComponentDefinition
}

const NewComponentPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({}),
	title: "New Component",
	sections: [],
	properties: [],
	type: "component",
	traits: ["uesio.standalone"],
}
export { NewComponentProps, NewComponentDefinition }

export default NewComponentPropertyDefinition
