import { definition, component, styles } from "@uesio/ui"

type IconLabelDefinition = {
	icon: string
	color: string
	text: string
	tooltip?: string
}

const IconLabel: definition.UC<IconLabelDefinition> = (props) => {
	const IconLabelUtility = component.getUtility("uesio/builder.iconlabel")
	const { context, definition } = props
	const { icon, color, text, tooltip } = definition

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IconLabelUtility
			variant={definition["uesio.variant"]}
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
