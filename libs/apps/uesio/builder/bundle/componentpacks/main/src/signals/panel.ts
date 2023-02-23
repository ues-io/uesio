import { context } from "@uesio/ui"
import { SignalDefinition, SignalDescriptor } from "../api/signalsapi"
import { getAvailablePanelIds } from "../api/panelapi"

// The key for the entire band
const PANEL_BAND = "panel"

const getPanelSelectOptions = (context: context.Context) =>
	getAvailablePanelIds(context)?.map((panelId) => ({
		label: panelId,
		value: panelId,
	}))

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${PANEL_BAND}/TOGGLE`]: {
		label: "Toggle",
		description: "Toggle panel status",
		properties: (signal: SignalDefinition, context: context.Context) => [
			{
				type: "SELECT",
				name: "panel",
				label: "Panel",
				options: getPanelSelectOptions(context),
			},
		],
	},
	[`${PANEL_BAND}/OPEN`]: {
		label: "Open",
		description: "Open panel",
		properties: (signal: SignalDefinition, context: context.Context) => [
			{
				type: "SELECT",
				name: "panel",
				label: "Panel",
				options: getPanelSelectOptions(context),
			},
		],
	},
	[`${PANEL_BAND}/CLOSE`]: {
		label: "Close",
		description: "Close panel",
		properties: (signal: SignalDefinition, context: context.Context) => [
			{
				type: "SELECT",
				name: "panel",
				label: "Panel",
				options: getPanelSelectOptions(context),
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
