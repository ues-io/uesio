import { SignalDefinition, SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const BOT_BAND = "bot"

interface CallSignal extends SignalDefinition {
	bot: string
	// params: BotParams
	namespace?: string
}

const signals: Record<string, SignalDescriptor> = {
	[`${BOT_BAND}/CALL`]: {
		label: "Call Bot",
		description: "Call a Bot",
		properties: (signal: CallSignal) => [
			{
				type: "NAMESPACE",
				name: "namespace",
				label: "Namespace",
			},
			{
				type: "BOT",
				namespace: signal.namespace,
				botType: "LISTENER",
				name: "bot",
				label: "Bot",
			},
			// TODO: Add Bot-specific Params!!!
		],
	},
}
export default signals
