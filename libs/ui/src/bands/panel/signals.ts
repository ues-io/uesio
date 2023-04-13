import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { open, close, toggle, closeAll } from "./operations"

// The key for the entire band
const PANEL_BAND = "panel"

interface ToggleSignal extends SignalDefinition {
	panel: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${PANEL_BAND}/TOGGLE`]: {
		dispatcher: (signal: ToggleSignal, context: Context) =>
			toggle(context, signal.panel),
	},
	[`${PANEL_BAND}/OPEN`]: {
		dispatcher: (signal: ToggleSignal, context: Context) =>
			open(context, signal.panel),
	},
	[`${PANEL_BAND}/CLOSE`]: {
		dispatcher: (signal: ToggleSignal, context: Context) =>
			close(context, signal.panel),
	},
	[`${PANEL_BAND}/CLOSE_ALL`]: {
		dispatcher: (signal: ToggleSignal, context: Context) =>
			closeAll(context),
	},
}

export default signals
