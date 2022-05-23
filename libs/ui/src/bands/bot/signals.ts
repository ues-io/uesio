import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams } from "../../platform/platform"
import { parseKey } from "../../component/path"

// The key for the entire band
const BOT_BAND = "bot"

interface CallSignal extends SignalDefinition {
	bot: string
	params: BotParams
}

const signals: Record<string, SignalDescriptor> = {
	[`${BOT_BAND}/CALL`]: {
		dispatcher:
			(signal: CallSignal, context: Context) =>
			async (dispatch, getState, platform) => {
				const [namespace, name] = parseKey(signal.bot)
				const mergedParams = context.mergeMap(signal.params)

				try {
					await platform.callBot(
						context,
						namespace,
						name,
						mergedParams || {}
					)
				} catch (error) {
					return context.addFrame({ errors: [error.message] })
				}

				return context
			},
		label: "Call Bot",
		properties: (signal: SignalDefinition) => [
			{
				type: "NAMESPACE",
				name: "namespace",
				label: "Namespace",
			},
			{
				type: "BOT",
				namespace: <string>signal.namespace,
				botType: "LISTENER",
				name: "bot",
				label: "Bot",
			},
		],
	},
}
export default signals
