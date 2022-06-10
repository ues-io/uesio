import { FunctionComponent } from "react"

import { styles, component } from "@uesio/ui"
import { AvatarProps } from "./avatardefinition"

const IOAvatar = component.getUtility("uesio/io.avatar")

const Avatar: FunctionComponent<AvatarProps> = (props) => {
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

export default Avatar
