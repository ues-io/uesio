import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { NotificationSeverity } from "./types"
import { add as addNotification, remove as removeNotification } from "."
import { nanoid } from "@reduxjs/toolkit"

// The key for the entire band
const NOTIFICATION_BAND = "notification"

interface AddNotificationSignal extends SignalDefinition {
	id?: string
	severity: NotificationSeverity
	text: string
	details: string
	path?: string
}

interface RemoveNotificationSignal extends SignalDefinition {
	id: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${NOTIFICATION_BAND}/ADD`]: {
		dispatcher:
			(signal: AddNotificationSignal, context: Context) => (dispatch) => {
				dispatch(
					addNotification({
						id: signal.id ? signal.id : nanoid(),
						severity: signal.severity,
						text: context.mergeString(signal.text),
						details: context.mergeString(signal.details),
						path: signal.path,
					})
				)
				return context
			},
		label: "Add Notification",
		description: "Add Notification",
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
	[`${NOTIFICATION_BAND}/REMOVE`]: {
		dispatcher:
			(signal: RemoveNotificationSignal, context: Context) =>
			(dispatch) => {
				dispatch(removeNotification(signal.id))
				return context
			},
		label: "Remove Notification",
		description: "Removes Notification",
		properties: () => [
			{
				type: "TEXT",
				name: "id",
				label: "Id",
			},
		],
	},
}

export default signals
