import { FunctionComponent } from "react"

import { styles } from "@uesio/ui"
import { AvatarProps } from "./avatardefinition"

const Avatar: FunctionComponent<AvatarProps> = (props) => {
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
				backgroundColor: props.context.getTheme().definition.palette
					.primary,
			},
		},
		props
	)
	return <div className={classes.root}>{props.definition.text}</div>
}

export default Avatar
