import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import operations from "./operations"

// The key for the entire band
const PANEL_BAND = "panel"

interface ToggleSignal extends SignalDefinition {
	panel: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${PANEL_BAND}/TOGGLE`]: {
		dispatcher: (signal: ToggleSignal, context: Context) =>
			operations.toggle(context, signal.panel),
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
		dispatcher: (signal: ToggleSignal, context: Context) =>
			operations.open(context, signal.panel),
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
		dispatcher: (signal: ToggleSignal, context: Context) =>
			operations.close(context, signal.panel),
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
		dispatcher: (signal: ToggleSignal, context: Context) =>
			operations.closeAll(context, signal.panel),
		label: "Close all",
		description: "Close all panels",
		properties: () => [],
	},
}

export default signals
