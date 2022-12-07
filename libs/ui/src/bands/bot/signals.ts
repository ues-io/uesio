import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams } from "../../platform/platform"
import { parseKey } from "../../component/path"
import { getErrorString } from "../utils"

// The key for the entire band
const BOT_BAND = "bot"

interface CallSignal extends SignalDefinition {
	bot: string
	params: BotParams
	namespace?: string
}

const signals: Record<string, SignalDescriptor> = {
	[`${BOT_BAND}/CALL`]: {
		dispatcher:
			(signal: CallSignal, context: Context) =>
			async (dispatch, getState, platform) => {
				const [namespace, name] = parseKey(signal.bot)
				const mergedParams = context.mergeMap(signal.params)

				try {
					const response = await platform.callBot(
						context,
						namespace,
						name,
						mergedParams || {}
					)

					return context.addFrame({ params: response.params })
				} catch (error) {
					const message = getErrorString(error)
					return context.addFrame({ errors: [message] })
				}

				return context
			},
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
		],
	},
}
export default signals
