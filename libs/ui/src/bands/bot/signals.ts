import { Context } from "../../context/context"
import { BandSignal } from "../../definition/signal"
import { BotParams } from "../../platform/platform"
import operations from "./operations"

// The key for the entire band
const BOT_BAND = "bot"

interface CallSignal extends BandSignal {
	bot: string
	params: BotParams
}

const signals = {
	[`${BOT_BAND}/CALL`]: {
		dispatcher: (signal: CallSignal, context: Context) =>
			operations.call(context, signal.bot, signal.params),
	},
}

export default signals
