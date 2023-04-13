import { SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const CONTEXT_BAND = "context"

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${CONTEXT_BAND}/CLEAR`]: {
		label: "Clear",
		description: "Clear context",
		properties: () => [
			{
				type: "TEXT",
				name: "type",
				label: "Type",
			},
		],
	},
	[`${CONTEXT_BAND}/SET`]: {
		label: "Set",
		description: "Set context",
		properties: () => [
			{
				type: "TEXT",
				name: "type",
				label: "Type",
			},
		],
	},
}

export default signals
