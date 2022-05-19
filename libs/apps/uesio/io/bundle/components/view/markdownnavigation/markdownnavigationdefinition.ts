import { definition, builder } from "@uesio/ui"

type Definition = {
	levels?: 1 | 2 | 3 | 4 | 5 | 6
	mdField?: string
	title?: "string"
}

interface Props extends definition.BaseProps {
	definition: Definition
}

const MarkdownNavigationPropertyDefinition: builder.BuildPropertiesDefinition =
	{
		title: "MarkdownNavigation",
		description: "Visible impression obtained by a camera",
		link: "https://docs.ues.io/",
		defaultDefinition: () => ({}),
		properties: [],
		sections: [],
		traits: ["uesio.standalone"],
		classes: ["root"],
		type: "component",
	}
export { Props, Definition }

export default MarkdownNavigationPropertyDefinition
