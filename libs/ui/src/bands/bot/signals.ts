import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams, platform } from "../../platform/platform"
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
		dispatcher: async (signalInvocation: CallSignal, context: Context) => {
			const [namespace, name] = parseKey(signalInvocation.bot)
			const mergedParams = context.mergeStringMap(signalInvocation.params)

			try {
				const response = await platform.callBot(
					context,
					namespace,
					name,
					mergedParams || {}
				)

				// If this invocation was given a stable identifier,
				// expose its outputs for later use
				if (response && signalInvocation.stepId) {
					return context.addSignalOutputFrame(
						signalInvocation.stepId,
						response.params
					)
				}
				return context
			} catch (error) {
				// TODO: Recommend putting errors within signal output frame as well
				const message = getErrorString(error)
				return context.addErrorFrame([message])
			}
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
