import { SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const PANEL_BAND = "panel"

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${PANEL_BAND}/TOGGLE`]: {
		label: "Toggle",
		description: "Toggle panel status",
		properties: () => [
			{
				type: "TEXT",
				name: "panel",
				label: "Panel",
			},
		],
	},
	[`${PANEL_BAND}/OPEN`]: {
		label: "Open",
		description: "Open panel",
		properties: () => [
			{
				type: "TEXT",
				name: "panel",
				label: "Panel",
			},
		],
	},
	[`${PANEL_BAND}/CLOSE`]: {
		label: "Close",
		description: "Close panel",
		properties: () => [
			{
				type: "TEXT",
				name: "panel",
				label: "Panel",
			},
		],
	},
	[`${PANEL_BAND}/CLOSE_ALL`]: {
		label: "Close all",
		description: "Close all panels",
		properties: () => [],
	},
}

export default signals
