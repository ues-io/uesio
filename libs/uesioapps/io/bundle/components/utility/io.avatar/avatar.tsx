import { FunctionComponent } from "react"
import { definition, styles, hooks } from "@uesio/ui"

interface AvatarProps extends definition.UtilityProps {
	image?: string
	text?: string
}

const Avatar: FunctionComponent<AvatarProps> = (props) => {
	const { image, context, text } = props
	const mergedImage = context.merge(image)
	const mergedText = context.merge(text)
	const uesio = hooks.useUesio(props)

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
					? `url('${uesio.file.getUserFileURL(
							context,
							mergedImage
					  )}')`
					: "initial",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundColor: mergedImage
					? "transparent"
					: context.getTheme().definition.palette.primary,
			},
		},
		props
	)
	return <div className={classes.root}>{!mergedImage && mergedText}</div>
}

export default Avatar
