import { FunctionComponent } from "react"
import { definition, component, styles } from "@uesio/ui"

type IconLabelDefinition = {
	icon: string
	color: string
	text: string
	tooltip?: string
}

interface Props extends definition.BaseProps {
	definition: IconLabelDefinition
}

const IconLabel: FunctionComponent<Props> = (props) => {
	const IconLabelUtility = component.getUtility("uesio/builder.iconlabel")
	const {
		context,
		definition: { icon, color, text, tooltip },
	} = props

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	return (
		<IconLabelUtility
			classes={classes}
			icon={icon}
			color={color}
			text={text}
			tooltip={tooltip}
			context={context}
		/>
	)
}

export default IconLabel
