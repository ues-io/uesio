import { styles, definition } from "@uesio/ui"

import { default as IOAvatar } from "../../utilities/avatar/avatar"

type AvatarDefinition = {
	image?: string
	text?: string
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Avatar: definition.UC<AvatarDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IOAvatar
			image={definition.image}
			text={definition.text}
			classes={classes}
			context={context}
		/>
	)
}

export default Avatar
