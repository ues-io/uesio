import { styles, definition } from "@uesio/ui"

import { default as IOAvatar } from "../../utilities/avatar/avatar"

type AvatarDefinition = {
	image?: string
	text?: string
}

const Avatar: definition.UC<AvatarDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOAvatar
			image={definition.image}
			text={definition.text}
			classes={classes}
			context={context}
		/>
	)
}

/*
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
*/

export default Avatar
