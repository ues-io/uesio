import {
	SignalBandDefinition,
	SignalDefinition,
	SignalDescriptor,
} from "../api/signalsapi"
import {
	ComponentProperty,
	StructProperty,
} from "../properties/componentproperty"
import { api } from "@uesio/ui"

interface CallBotSignal extends SignalDefinition {
	bot: string
}

// The key for the entire band
const BAND = "bot"
const signals: SignalBandDefinition = {
	band: BAND,
	label: "Bots",
	signals: {
		[`${BAND}/CALL`]: {
			label: "Call Bot",
			description: "Call a Bot",
			properties: (signal: CallBotSignal, context) => {
				const props = [
					{
						type: "METADATA",
						metadataType: "BOT",
						groupingValue: "LISTENER",
						name: "bot",
						label: "Bot",
					},
				] as ComponentProperty[]
				// Fetch bot params
				if (signal.bot) {
					const parts = signal.bot.split("/")
					const [params] = api.bot.useParams(
						context,
						parts[0],
						parts[1].split(".").join("/"),
						"listener"
					)
					if (params && params.length) {
						props.push({
							type: "STRUCT",
							name: "params",
							label: "Parameters",
							properties: params.map(
								({ name, type, required }) =>
									({
										type: type === "LIST" ? "TEXT" : type,
										name,
										required,
									} as ComponentProperty)
							) as ComponentProperty[],
						} as StructProperty)
					}
				}
				return props
			},
			canError: true,
			outputs: [{ name: "params", type: "MAP" }],
		},
	} as Record<string, SignalDescriptor>,
}
export default signals
