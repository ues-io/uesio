import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface AvatarProps extends definition.UtilityProps {
	image?: string
	text?: string
}

const Avatar: FunctionComponent<AvatarProps> = (props) => {
	const { image, context, text } = props
	const mergedImage = context.merge(image)
	const mergedText = context.merge(text)

	const bgImageClass = mergedImage ? `bg-[url(${mergedImage})]` : "initial"
	const bgColorClass = mergedImage ? "bg-transparent" : "bg-primary"

	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props,
		"uesio/io.avatar"
	)
	return (
		<div
			className={styles.mergeClasses(
				styles.cx(bgImageClass, bgColorClass, classes.root)
			)}
		>
			{!mergedImage && mergedText}
		</div>
	)
}

export default Avatar
