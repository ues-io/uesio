import { definition, builder } from "@uesio/ui"

type TextDefinition = {
	text?: string
	element?: string
}

interface TextProps extends definition.BaseProps {
	definition: TextDefinition
}

const TextPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Button",
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
	],
	sections: [],
	actions: [],
}
export { TextProps, TextDefinition }

export default TextPropertyDefinition
