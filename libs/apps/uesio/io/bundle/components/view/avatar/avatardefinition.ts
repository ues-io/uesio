import { definition, builder } from "@uesio/ui"

type AvatarDefinition = {
	image?: string
	text?: string
}

interface AvatarProps extends definition.BaseProps {
	definition: AvatarDefinition
}

const AvatarPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Avatar",
	description: "Display an image or initials to represent a record.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({
		text: "$User{initials}",
		image: "$User{picture}",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "text",
		},
		{
			name: "image",
			type: "TEXT",
			label: "image",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.standalone"],
	type: "component",
	classes: ["root"],
	category: "CONTENT",
}
export { AvatarProps, AvatarDefinition }

export default AvatarPropertyDefinition
