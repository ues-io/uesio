import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

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
				fontDisplay: "block",
				fontVariationSettings: "'FILL' 1",
			},
		},
		props
	)

	if (props.icon === undefined) return null

	return <span className={classes.root}>{props.icon}</span>
}

export { IconUtilityProps }
export default Icon
