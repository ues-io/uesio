import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { NotificationSeverity } from "./types"
import { add as addNotification, remove as removeNotification } from "."
import { nanoid } from "@reduxjs/toolkit"
import { dispatch } from "../../store/store"

// The key for the entire band
const NOTIFICATION_BAND = "notification"

export interface AddNotificationSignal extends SignalDefinition {
	id?: string
	severity: NotificationSeverity
	text: string
	details: string
	path?: string
	duration?: string
}

interface RemoveNotificationSignal extends SignalDefinition {
	id: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${NOTIFICATION_BAND}/ADD`]: {
		dispatcher: (signal: AddNotificationSignal, context: Context) => {
			dispatch(
				addNotification({
					id: signal.id ? signal.id : nanoid(),
					severity: signal.severity,
					text: context.mergeString(signal.text),
					details: context.mergeString(signal.details),
					path: signal.path,
					...(signal.duration && { duration: signal.duration }),
				})
			)
			return context
		},
	},
	[`${NOTIFICATION_BAND}/REMOVE`]: {
		dispatcher: (signal: RemoveNotificationSignal, context: Context) => {
			dispatch(removeNotification(signal.id))
			return context
		},
	},
}

export default signals
