import { definition, builder } from "@uesio/ui"

type TextDefinition = {
	text?: string
	element?: string
	color?: string
} & definition.BaseDefinition

interface TextProps extends definition.BaseProps {
	definition: TextDefinition
}

const TextPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Text",
	defaultDefinition: () => ({
		text: "Text Goes Here",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "element",
			type: "TEXT",
			label: "element",
		},
		{
			name: "color",
			type: "TEXT",
			label: "color",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { TextProps, TextDefinition }

export default TextPropertyDefinition
