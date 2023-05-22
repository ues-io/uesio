import { FunctionComponent, useEffect } from "react"
import { definition, styles, notification, api } from "@uesio/ui"
import Icon from "../icon/icon"
interface AlertProps extends definition.UtilityProps {
	text?: string
	details?: string
	severity?: notification.NotificationSeverity
	onClick?: () => void
	duration?: number
	id: string
}

const types = {
	success: {
		color: "green",
		icon: "info",
	},
	info: {
		color: "blue",
		icon: "lightbulb",
	},
	error: {
		color: "red",
		icon: "error",
	},
	warning: {
		color: "orange",
		icon: "info",
	},
}

const Alert: FunctionComponent<AlertProps> = (props) => {
	const { text, severity, context, details, id, duration } = props
	let alertType = types[severity || "error"]
	if (!alertType) {
		alertType = types.error
	}
	const { color, icon } = alertType

	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				"cursor-pointer",
				"bg-slate-50",
				"p-4",
				"grid",
				"grid-cols-[auto_1fr_auto]",
				"gap-4",
				"rounded-lg",
				"shadow",
				"items-start",
			],
			title: ["font-medium", "text-xs"],
			closeIcon: ["text-slate-500"],
			severityIcon: [
				`bg-[${color}]`,
				"p-1",
				"rounded-full",
				"text-white",
			],
		},
		props
	)
	useEffect(() => {
		let time = typeof duration === "number" ? duration : 5
		if (time > 0) {
			time = time * 1000
			const timer = setTimeout(() => {
				api.signal.run(
					{
						signal: "notification/REMOVE",
						id,
					},
					context
				)
			}, time)

			return () => clearTimeout(timer)
		}
	}, [duration, id, context])

	const mergedText = context.merge(text)
	const mergedDetails = context.merge(details)
	return (
		<div onClick={props.onClick} className={classes.root}>
			<Icon
				className={classes.severityIcon}
				context={props.context}
				icon={icon}
			/>
			<div>
				<p className={classes.title}>{mergedText}</p>
				<p>{mergedDetails}</p>
			</div>
			<Icon
				className={classes.closeIcon}
				context={props.context}
				icon="close"
			/>
		</div>
	)
}

export default Alert
