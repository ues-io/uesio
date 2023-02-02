import { SignalDescriptor } from "../definition/signal"
import { SignalDefinition } from "../signalexports"
import { Context } from "./context"

// The key for the entire band
const CONTEXT_BAND = "context"

interface ClearSignal extends SignalDefinition {
	type: "WORKSPACE" | "SITE_ADMIN"
}

interface SetSignal extends SignalDefinition {
	type: "WORKSPACE" | "SITE_ADMIN"
	name: string
	app: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${CONTEXT_BAND}/CLEAR`]: {
		dispatcher: (signal: ClearSignal, context: Context) => {
			if (signal.type === "SITE_ADMIN") {
				context.deleteSiteAdmin()
			} else if (signal.type === "WORKSPACE") {
				context.deleteWorkspace()
			}
			return context
		},
		label: "Clear",
		description: "Context clear",
		properties: () => [
			{
				type: "TEXT",
				name: "type",
				label: "Type",
			},
		],
	},
	[`${CONTEXT_BAND}/SET`]: {
		dispatcher: (signal: SetSignal, context: Context) => {
			if (signal.type === "SITE_ADMIN") {
				context.addSiteAdmin({
					name: context.mergeString(signal.name),
					app: context.mergeString(signal.app),
				})
			} else if (signal.type === "WORKSPACE") {
				context.addWorkspace({
					name: context.mergeString(signal.name),
					app: context.mergeString(signal.app),
				})
			}
			return context
		},
		label: "Set",
		description: "Context set",
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
