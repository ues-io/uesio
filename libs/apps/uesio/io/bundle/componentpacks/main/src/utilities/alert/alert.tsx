import { FunctionComponent } from "react"
import { definition, styles, notification, component } from "@uesio/ui"

interface AlertProps extends definition.UtilityProps {
	text?: string
	details?: string
	severity?: notification.NotificationSeverity
	onClick?: () => void
}

const types = {
	success: {
		icon: "info",
		iconStyles: ["text-slate-600"],
	},
	info: {
		icon: "lightbulb",
		iconStyles: ["text-blue-100"],
	},
	error: {
		icon: "error",
		iconStyles: ["text-red-600"],
	},
	warning: {
		icon: "info",
		iconStyles: ["text-orange-100"],
	},
	loading: {
		icon: "refresh",
		iconStyles: ["animate-spin", "text-slate-700"],
	},
}

const Alert: FunctionComponent<AlertProps> = (props) => {
	const { text, severity, context, details } = props
	const Icon = component.getUtility("uesio/io.icon")

	const alertType = types[severity || "error"]

	const { icon, iconStyles } = alertType

	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				"bg-white",
				"rounded",
				"shadow-lg",
				"p-4",
				"flex",
				"gap-4",
				"items-start",
				"cursor-pointer",
			],
			content: ["flex-1"],
			icon: [...iconStyles],
			title: ["text-black", "flex-1"],
			body: ["text-slate-500"],
		},
		props,
		"uesio/io.alert"
	)

	return (
		<div onClick={props.onClick} className={classes.root}>
			<Icon className={classes.icon} context={context} icon={icon} />

			<div className={classes.content}>
				<p className={classes.title}>{context.merge(text)}</p>
				<p className={classes.body}>{context.merge(details)}</p>
			</div>

			<Icon context={context} icon={"close"} />
		</div>
	)
}

export default Alert
