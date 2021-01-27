import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { BotParams } from "../../platform/platform"
import operations from "./operations"

// The key for the entire band
const BOT_BAND = "bot"

interface CallSignal extends SignalDefinition {
	bot: string
	params: BotParams
}

const signals: { [key: string]: SignalDescriptor } = {
	[`${BOT_BAND}/CALL`]: {
		dispatcher: (signal: CallSignal, context: Context) =>
			operations.call(context, signal.bot, signal.params),
		label: "TODO: Bot Call",
		properties: () => [],
	},
}
export default signals
