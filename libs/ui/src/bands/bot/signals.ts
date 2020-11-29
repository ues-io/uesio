import { SignalDefinition } from "../../definition/signal"
import { BotParams } from "../../platform/platform"
import { BotSignal } from "./types"
import operations from "./operations"

// The key for the entire band
const BOT_BAND = "bot"

// The keys for all signals in the band
const CALL = "CALL"

// "Signal Creators" for all of the signals in the band
const callSignal = (bot: string, params?: BotParams) => ({
	signal: CALL as typeof CALL,
	band: BOT_BAND as typeof BOT_BAND,
	bot,
	params,
})

// "Signal Handlers" for all of the signals in the band
const handlers = {
	[CALL]: {
		dispatcher: operations.call,
	},
}

// A map of all of the handlers in the bot band and a function that
// can narrow the type of a signal down to a specific signal
const registry = {
	handlers,
	validateSignal: (signal: SignalDefinition): signal is BotSignal =>
		signal.signal in registry.handlers,
}

export { callSignal, registry }
