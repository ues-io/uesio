import { definition, styles } from "@uesio/ui"

interface AvatarProps {
	image?: string
	text?: string
}

const Avatar: definition.UtilityComponent<AvatarProps> = (props) => {
	const { image, context, text } = props
	const mergedImage = context.merge(image)
	const mergedText = context.merge(text)

	const bgImageClass = mergedImage ? `bg-[url(${mergedImage})]` : "initial"
	const bgColorClass = mergedImage ? "bg-transparent" : "bg-primary"

	const classes = styles.useUtilityStyleTokens(
		{
			root: [bgImageClass, bgColorClass],
		},
		props,
		"uesio/io.avatar"
	)

	return <div className={classes.root}>{!mergedImage && mergedText}</div>
}

export default Avatar
