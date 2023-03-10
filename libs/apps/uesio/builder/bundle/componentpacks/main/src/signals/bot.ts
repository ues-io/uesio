import { SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const BOT_BAND = "bot"

// interface CallSignal extends SignalDefinition {
// 	bot: metadata.MetadataKey
// 	// params: BotParams
// }

const signals: Record<string, SignalDescriptor> = {
	[`${BOT_BAND}/CALL`]: {
		label: "Call Bot",
		description: "Call a Bot",
		properties: () => [
			{
				type: "METADATA",
				metadataType: "BOT",
				groupingValue: "LISTENER",
				name: "bot",
				label: "Bot",
			},
			// TODO: Add Bot-specific Params!!!
		],
	},
}
export default signals
