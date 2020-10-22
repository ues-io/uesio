import { definition, builder, styles } from "@uesio/ui"

type AvatarDefinition = {
	margin: styles.MarginDefinition
}

interface AvatarProps extends definition.BaseProps {
	definition: AvatarDefinition
}

const AvatarPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Avatar",
	defaultDefinition: () => ({}),
	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [],
		},
	],
}
export { AvatarProps }

export default AvatarPropertyDefinition
