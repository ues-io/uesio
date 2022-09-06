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

	const classes = styles.useUtilityStyles(
		{
			root: {
				color: "white",
				borderRadius: "20px",
				fontSize: "9pt",
				textTransform: "uppercase",
				alignItems: "center",
				textAlign: "center",
				height: "32px",
				width: "32px",
				display: "grid",
				fontWeight: "bold",
				backgroundImage: mergedImage
					? `url('${mergedImage}')`
					: "initial",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundColor: mergedImage
					? "transparent"
					: context.getTheme().definition.colors.primary,
			},
		},
		props
	)
	return <div className={classes.root}>{!mergedImage && mergedText}</div>
}

export default Avatar
