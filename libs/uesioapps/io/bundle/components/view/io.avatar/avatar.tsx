import { FunctionComponent } from "react"

import { styles, hooks } from "@uesio/ui"
import { AvatarProps } from "./avatardefinition"

const Avatar: FunctionComponent<AvatarProps> = (props) => {
	const { definition, context } = props
	const image = context.merge(definition.image)
	const text = context.merge(definition.text)
	const uesio = hooks.useUesio(props)

	const classes = styles.useStyles(
		{
			root: {
				margin: "0 16px",
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
				backgroundImage: image
					? `url('${uesio.file.getUserFileURL(
							context,
							image,
							true
					  )}')`
					: "initial",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundColor: props.context.getTheme().definition.palette
					.primary,
			},
		},
		props
	)
	return <div className={classes.root}>{!image && text}</div>
}

export default Avatar
