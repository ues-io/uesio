import { definition, component, styles } from "@uesio/ui"
import IconLabelUtility from "../../utilities/iconlabel/iconlabel"

type IconLabelDefinition = {
	icon: string
	color: string
	text: string
	subtitle?: string
	tooltip?: string
}

const StyleDefaults = Object.freeze({
	root: [],
	title: [],
	subtitle: [],
})

const IconLabel: definition.UC<IconLabelDefinition> = (props) => {
	const { context, definition } = props
	const { icon, color, text, subtitle, tooltip } = definition

	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IconLabelUtility
			variant={definition[component.STYLE_VARIANT]}
			classes={classes}
			icon={icon}
			color={color}
			text={text}
			subtitle={subtitle}
			tooltip={tooltip}
			context={context}
		/>
	)
}
IconLabel.displayName = "IconLabel"

export default IconLabel
