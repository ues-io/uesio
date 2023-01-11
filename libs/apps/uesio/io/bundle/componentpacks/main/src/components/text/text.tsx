import { styles, definition } from "@uesio/ui"
import { AcceptedElements, default as IOText } from "../../utilities/text/text"

type TextDefinition = {
	text?: string
	element?: AcceptedElements
	color?: string
	align?: AlignSetting
}

const Text: definition.UC<TextDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOText
			classes={classes}
			variant={definition["uesio.variant"]}
			context={context}
			text={definition.text}
			element={definition.element}
			color={definition.color}
			align={definition.align}
		/>
	)
}

/*
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
*/

export default Text
