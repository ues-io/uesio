import { SignalBandDefinition } from "../api/signalsapi"
import { ComponentProperty } from "../properties/componentproperty"
import { api, signal } from "@uesio/ui"
import { getPropertyTypeFromParamDef } from "./route"

interface CallBotSignal extends signal.SignalDefinition {
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
				const props: ComponentProperty[] = [
					{
						type: "METADATA",
						metadata: {
							type: "BOT",
							grouping: "LISTENER",
						},
						name: "bot",
						label: "Bot",
					},
				]
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
							properties: params.map((paramDef) => {
								const { name, required } = paramDef
								return {
									type: getPropertyTypeFromParamDef(paramDef),
									name,
									required,
								}
							}),
						})
					}
				}
				return props
			},
			canError: true,
			outputs: [{ name: "params", type: "MAP" }],
		},
	},
}
export default signals
