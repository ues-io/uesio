import { FC } from "react"
import { definition, styles, component } from "@uesio/ui"

interface T extends definition.UtilityProps {
	icon: string
	color: string
	text: string
	tooltip?: string
	fill?: boolean
}

const IconLabel: FC<T> = (props) => {
	const Text = component.getUtility("uesio/io.text")
	const Tooltip = component.getUtility("uesio/io.tooltip")
	const { icon, color, text, tooltip, context } = props

	const fill = props.fill === undefined ? true : props.fill

	const classes = styles.useUtilityStyleTokens(
		{
			root: [],
			icon: [
				!icon && "hidden",
				!fill && "[font-variation-settings:'FILL'_0]",
			],
		},
		props,
		"uesio/builder.iconlabel"
	)
	const iconElement = (
		<Text
			variant="uesio/io.icon"
			text={icon || "circle"}
			color={color}
			classes={{
				root: classes.icon,
			}}
			context={context}
		/>
	)
	return (
		<div className={classes.root}>
			{tooltip ? (
				<Tooltip text={tooltip} offset={10} context={context}>
					{iconElement}
				</Tooltip>
			) : (
				iconElement
			)}
			<Text text={text} context={context} />
		</div>
	)
}

export default IconLabel
