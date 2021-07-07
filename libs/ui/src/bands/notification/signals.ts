import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { NotificationSeverity } from "./types"
import { add as addNotification } from "."
import shortid from "shortid"

// The key for the entire band
const NOTIFICATION_BAND = "notification"

interface AddNotificationSignal extends SignalDefinition {
	severity: NotificationSeverity
	text: string
	details: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${NOTIFICATION_BAND}/ADD`]: {
		dispatcher: (signal: AddNotificationSignal, context: Context) => (
			dispatch
		) => {
			dispatch(
				addNotification({
					id: shortid.generate(),
					severity: signal.severity,
					text: signal.text,
					details: signal.details,
				})
			)
			return context
		},
		label: "Add Notification",
		properties: () => [
			{
				type: "TEXT",
				name: "severity",
				label: "Severity",
			},
			{
				type: "TEXT",
				name: "text",
				label: "Text",
			},
			{
				type: "TEXT",
				name: "details",
				label: "Details",
			},
		],
	},
}

export default signals
