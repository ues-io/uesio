import { FunctionComponent } from "react"
import { definition, styles, notification } from "@uesio/ui"

interface AlertProps extends definition.UtilityProps {
	text?: string
	details?: string
	severity?: notification.NotificationSeverity
	onClick?: () => void
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
	const { text, severity, context, details } = props
	let alertType = types[severity || "error"]
	if (!alertType) {
		alertType = types.error
	}
	const { color, icon } = alertType

	const classes = styles.useUtilityStyles(
		{
			root: {
				cursor: "pointer",
				backgroundColor: "#f9f9f9",
				padding: "1.3em",
				display: "grid",
				gridTemplateColumns: "auto 1fr auto",
				columnGap: "1.3em",
				transform: "translateX(8px)",
				opacity: "0",
				borderRadius: "3px",
				transition:
					"transform 0.15s ease-in-out, border-left 0.1s ease 0.1s, opacity 0.3s ease-in-out",
				borderTopLeftRadius: "3px",
				borderBottomLeftRadius: "3px",
				borderLeft: `0px solid ${color}`,
				boxShadow: "0 0 4px #00000033",

				"&:hover .icon--close": {
					color: "#000",
				},

				p: {
					opacity: 0,
					transition: "opacity 0.125s ease-in-out 0.1s",
					margin: "0 0 0.25em 0",
					fontSize: "9pt",
					lineHeight: "14pt",
					color: "rgb(68, 68, 68)",
					overflowWrap: "anywhere",
				},

				"&.visible": {
					opacity: 1,
					transform: "translateX(0)",
					borderLeft: "6px solid ${color}",

					"&::before": {
						left: "-5px",
					},

					p: {
						opacity: 1,
					},
				},

				".title": {
					fontWeight: 700,
				},

				".icon": {
					fontFamily: "Material Icons",

					"&--rounded": {
						backgroundColor: `${color}`,
						padding: "4px",
						borderRadius: "50%",
						color: "#fff",
					},
					"&--close": {
						color: "#aaa",
						transition: "0.125s ease-in-out",
					},
				},
			},
		},
		props
	)

	const mergedText = context.merge(text)
	const mergedDetails = context.merge(details)
	return (
		<div
			onClick={props.onClick}
			className={styles.cx(classes.root, "visible")}
		>
			<div>
				<span className="icon icon--rounded">{icon}</span>
			</div>
			<div className="content">
				<p className="title">{mergedText}</p>
				<p>{mergedDetails}</p>
			</div>
			<span className="icon icon--close">close</span>
		</div>
	)
}

export default Alert
