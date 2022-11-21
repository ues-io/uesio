import { definition, builder } from "@uesio/ui"

type TitleBarDefinition = {
	title: string
	subtitle: string
} & definition.BaseDefinition

interface TitleBarProps extends definition.BaseProps {
	definition: TitleBarDefinition
}

const TitleBarPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Title Bar",
	description: "A section description with a main title and subtitle.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({ title: "New Title" }),
	properties: [
		{
			name: "title",
			type: "TEXT",
			label: "Title",
		},
		{
			name: "subtitle",
			type: "TEXT",
			label: "Subtitle",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	category: "CONTENT",
}
export { TitleBarProps, TitleBarDefinition }

export default TitleBarPropertyDefinition
