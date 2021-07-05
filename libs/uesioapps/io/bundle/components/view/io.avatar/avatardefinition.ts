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
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}
export { AvatarProps, AvatarDefinition }

export default AvatarPropertyDefinition
