import { definition, styles, component } from "@uesio/ui"

interface T {
	icon: string
	color: string
	text: string
	subtitle?: string
	tooltip?: string
	fill?: boolean
}

const IconLabel: definition.UtilityComponent<T> = (props) => {
	const Text = component.getUtility("uesio/io.text")
	const Tooltip = component.getUtility("uesio/io.tooltip")
	const { icon, color, text, subtitle, tooltip, context } = props

	const fill = props.fill === undefined ? true : props.fill

	const classes = styles.useUtilityStyleTokens(
		{
			root: [],
			icon: [
				!icon && "hidden",
				!fill && "[font-variation-settings:'FILL'_0]",
			],
			title: [],
			subtitle: [],
		},
		props,
		"uesio/io.iconlabel"
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
			<div>
				<p className={classes.title}>{context.merge(text)}</p>
				{/* Render whitespace if subtitle is empty string */}
				{(subtitle || subtitle === "") && (
					<p className={classes.subtitle}>
						{subtitle === "" ? (
							<>&nbsp;</>
						) : (
							context.merge(subtitle)
						)}
					</p>
				)}
			</div>
		</div>
	)
}

export default IconLabel
