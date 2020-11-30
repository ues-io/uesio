import { BotParams } from "../../platform/platform"
import operations from "./operations"

// The key for the entire band
const BOT_BAND = "bot"

// The keys for all signals in the band
const CALL = `${BOT_BAND}/CALL`

// "Signal Creators" for all of the signals in the band
const callCreator = (bot: string, params?: BotParams) => ({
	signal: CALL,
	band: "", //TODO: remove this
	bot,
	params,
})

const signals = [
	{
		key: CALL,
		dispatcher: operations.call,
	},
]

export { callCreator }
export default signals
