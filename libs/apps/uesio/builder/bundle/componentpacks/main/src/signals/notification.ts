import { SignalBandDefinition, SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const BAND = "notification"

// Metadata for all of the signals in the band
const signals: SignalBandDefinition = {
	band: BAND,
	label: "Notifications",
	signals: {
		[`${BAND}/ADD`]: {
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
		[`${BAND}/REMOVE`]: {
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
	} as Record<string, SignalDescriptor>,
}

export default signals
