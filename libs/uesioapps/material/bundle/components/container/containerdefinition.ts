import { definition, builder } from "@uesio/ui"

type ContainerDefinition = {
	components: definition.DefinitionList
	padding?: number
}

interface ContainerProps extends definition.BaseProps {
	definition: ContainerDefinition
}

const ContainerPropertyDefinition: builder.BuildPropertiesDefinition = {
	defaultDefinition: () => ({
		components: [],
	}),
	title: "Container",
	sections: [],
	traits: ["uesio.standalone"],
}
export { ContainerProps, ContainerDefinition }

export default ContainerPropertyDefinition
