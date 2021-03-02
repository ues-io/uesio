import { definition, builder } from "@uesio/ui"

type Materialwrapperdefinition = {
	components: definition.DefinitionList
}

interface MaterialWrapperProps extends definition.BaseProps {
	definition: Materialwrapperdefinition
}

const MaterialWrapperDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		components: [],
	}),
	title: "Material Wrapper",
	sections: [],
	traits: ["uesio.standalone"],
}
export { MaterialWrapperProps, Materialwrapperdefinition }

export default MaterialWrapperDefinition
