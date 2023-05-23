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
				{
					type: "SELECT",
					name: "duration",
					label: "Duration",
					blankOptionLabel: "Select to Add (s)",
					options: [
						{ label: "1", value: "1" },
						{ label: "2", value: "2" },
						{ label: "5", value: "5" },
						{ label: "10", value: "10" },
						{ label: "30", value: "30" },
					],
					onChange: [
						{
							updates: [
								{
									field: "duration",
								},
							],
							conditions: [
								{
									field: "duration",
									operator: "EQ",
									value: "",
									type: "fieldValue",
								},
							],
						},
					],
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
