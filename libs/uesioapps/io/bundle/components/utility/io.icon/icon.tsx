import { FunctionComponent } from "react"
import { definition, styles, materialIcons } from "@uesio/ui"

interface IconUtilityProps extends definition.UtilityProps {
	icon?: string
}

const Icon: FunctionComponent<IconUtilityProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {
				fontFamily: "Material Icons",
				fontWeight: "normal",
				fontStyle: "normal",
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

	if (props.icon && materialIcons.includes(props.icon)) {
		return <span className={classes.root}>{props.icon}</span>
	}

	return null
}

export { IconUtilityProps }
export default Icon
