import { definition, builder } from "@uesio/ui"

type TextDefinition = {
	text?: string
	element?: string
	color?: string
	align?: string
} & definition.BaseDefinition

interface TextProps extends definition.BaseProps {
	definition: TextDefinition
}

const TextPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Text",
	description: "Display text content",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "Text Goes Here",
		element: "div",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "element",
			label: "element",
			type: "SELECT",
			options: [
				"p",
				"span",
				"div",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"pre",
			].map((el) => ({ label: el, value: el })),
		},
		{
			name: "color",
			type: "TEXT",
			label: "color",
		},
		{
			name: "align",
			label: "align",
			type: "SELECT",
			options: [
				{
					value: "",
					label: "",
				},
				{
					value: "start",
					label: "start",
				},
				{
					value: "end",
					label: "end",
				},
				{
					value: "left",
					label: "left",
				},
				{
					value: "right",
					label: "right",
				},
				{
					value: "center",
					label: "center",
				},
				{
					value: "justify",
					label: "justify",
				},
				{
					value: "match-parent",
					label: "match-parent",
				},
			],
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
	category: "CONTENT",
}
export { TextProps, TextDefinition }

export default TextPropertyDefinition
