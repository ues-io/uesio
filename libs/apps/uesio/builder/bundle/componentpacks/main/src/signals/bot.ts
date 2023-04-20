import { SignalBandDefinition, SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const BAND = "bot"
const signals: SignalBandDefinition = {
	band: BAND,
	label: "Bots",
	signals: {
		[`${BAND}/CALL`]: {
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
			// TODO: Change bot responses to be a named map
			// outputs: [{ name: "result", type: "MAP" }],
		},
	} as Record<string, SignalDescriptor>,
}
export default signals
