import { definition, builder, context } from "@uesio/ui"

type MarkDownDefinition = {
	markdown?: string
	mode: context.FieldMode
} & definition.BaseDefinition

interface MarkDownProps extends definition.BaseProps {
	definition: MarkDownDefinition
}

const MarkDownPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "MarkDown",
	description: "MarkDown",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		markdown: "MarkDown Goes Here",
	}),
	properties: [
		{
			name: "markdown",
			type: "TEXT_AREA",
			label: "Markdown",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "DATA",
}
export { MarkDownProps, MarkDownDefinition }

export default MarkDownPropertyDefinition
