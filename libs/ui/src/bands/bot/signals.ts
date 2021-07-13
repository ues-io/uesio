import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams } from "../../platform/platform"
import callBot from "./operations/call"
import { unwrapResult } from "@reduxjs/toolkit"

// The key for the entire band
const BOT_BAND = "bot"

interface CallSignal extends SignalDefinition {
	bot: string
	params: BotParams
}

const signals: Record<string, SignalDescriptor> = {
	[`${BOT_BAND}/CALL`]: {
		dispatcher:
			(signal: CallSignal, context: Context) => async (dispatch) => {
				try {
					unwrapResult(
						await dispatch(
							callBot({
								botname: signal.bot,
								context,
								params: signal.params,
							})
						)
					)
					return context
				} catch (error) {
					const errors: Error[] = [error]
					return context.addFrame({ errors })
				}
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
