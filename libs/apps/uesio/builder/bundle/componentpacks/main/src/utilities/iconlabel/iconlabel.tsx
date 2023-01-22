import { FC } from "react"
import { definition, styles, component } from "@uesio/ui"

interface T extends definition.UtilityProps {
	icon: string
	color: string
	text: string
	tooltip?: string
}

const IconLabel: FC<T> = (props) => {
	const Text = component.getUtility("uesio/io.text")
	const Tooltip = component.getUtility("uesio/io.tooltip")
	const { icon, color, text, tooltip, context } = props

	const classes = styles.useUtilityStyles(
		{
			root: {},
			icon: {
				...(!icon && { visibility: "hidden" }),
			},
			title: {},
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
			<Text
				text={text}
				context={context}
				classes={{
					root: classes.title,
				}}
			/>
		</div>
	)
}

export default IconLabel
