import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface IconProps extends definition.BaseProps {
	icon?: string
}

const Icon: FunctionComponent<IconProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				fontFamily: "Material Icons",
				fontWeight: "normal",
				fontStyle: "normal",
				fontSize: "18px" /* Preferred icon size */,
				display: "inline-block",
				lineHeight: 1,
				textTransform: "none",
				letterSpacing: "normal",
				verticalAlign: "middle",
				wordWrap: "normal",
				whiteSpace: "nowrap",
				direction: "ltr",
			},
		},
		props
	)
	return <span className={classes.root}>{props.icon}</span>
}

export default Icon
