import { context } from "@uesio/ui"
import { SignalDefinition, SignalDescriptor } from "../api/signalsapi"
import { getAvailablePanelIds } from "../api/panelapi"
import { ComponentProperty } from "../properties/componentproperty"

// The key for the entire band
const PANEL_BAND = "panel"

const getPanelSelectOptions = (context: context.Context) =>
	getAvailablePanelIds(context)?.map((panelId) => ({
		label: panelId,
		value: panelId,
	}))

const getPanelSelectProperties = (
	signal: SignalDefinition,
	context: context.Context
) =>
	[
		{
			type: "SELECT",
			name: "panel",
			label: "Panel",
			blankOptionLabel: "",
			options: getPanelSelectOptions(context),
		},
	] as ComponentProperty[]

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${PANEL_BAND}/TOGGLE`]: {
		label: "Toggle",
		description: "Toggle panel status",
		properties: getPanelSelectProperties,
	},
	[`${PANEL_BAND}/OPEN`]: {
		label: "Open",
		description: "Open panel",
		properties: getPanelSelectProperties,
	},
	[`${PANEL_BAND}/CLOSE`]: {
		label: "Close",
		description: "Close panel",
		properties: getPanelSelectProperties,
	},
	[`${PANEL_BAND}/CLOSE_ALL`]: {
		label: "Close all",
		description: "Close all panels",
		properties: () => [],
	},
}

export default signals
