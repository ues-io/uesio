import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface IconProps extends definition.UtilityProps {
	icon?: string
	fontSize?: "string"
}

const Icon: FunctionComponent<IconProps> = (props) => {
	const { fontSize = "1em" } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "Material Icons",
				fontWeight: "normal",
				fontStyle: "normal",
				fontSize,
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
