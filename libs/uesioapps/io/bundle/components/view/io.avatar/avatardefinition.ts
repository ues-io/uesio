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
}
export { AvatarProps, AvatarDefinition }

export default AvatarPropertyDefinition
