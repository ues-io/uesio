import { FunctionComponent } from "react"
import { definition, styles, materialIcons } from "@uesio/ui"
import { CSSInterpolation } from "@emotion/serialize"

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
				...props.styles,
			},
		},
		props
	)

	if (props.icon === undefined) return null

	if (props.icon === "" || !materialIcons.includes(props.icon)) {
		return <span className={classes.root}>&nbsp;</span>
	}

	return <span className={classes.root}>{props.icon}</span>
}

export { IconUtilityProps }
export default Icon
