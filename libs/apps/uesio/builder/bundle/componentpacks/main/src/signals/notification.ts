import { SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const NOTIFICATION_BAND = "notification"

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${NOTIFICATION_BAND}/ADD`]: {
		label: "Add Notification",
		description: "Add Notification",
		properties: () => [
			{
				type: "SELECT",
				name: "severity",
				label: "Severity",
				options: [
					{ value: "", label: "" },
					{ value: "success", label: "SUCCESS" },
					{ value: "info", label: "INFO" },
					{ value: "warning", label: "WARN" },
					{ value: "error", label: "ERROR" },
				],
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
