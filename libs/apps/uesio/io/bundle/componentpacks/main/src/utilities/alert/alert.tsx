import { FunctionComponent, useEffect } from "react"
import { definition, styles, notification, api } from "@uesio/ui"
import Icon from "../icon/icon"
interface AlertProps extends definition.UtilityProps {
	text?: string
	details?: string
	severity?: notification.NotificationSeverity
	onClick?: () => void
	duration?: number
	key: string
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
	const { text, severity, context, details, key, duration } = props
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
		if (duration && duration > 0) {
			const time = duration * 1000
			const timer = setTimeout(() => {
				if (duration && duration > 0) {
					api.signal.run(
						{
							signal: "notification/REMOVE",
							id: key,
						},
						context
					)
				}
			}, time)

			return () => clearTimeout(timer)
		}
	}, [duration, key, context])

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
