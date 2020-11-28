import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { BotParams, Platform } from "../../platform/platform"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"
import { PayloadAction } from "@reduxjs/toolkit"
import { BotSignal, CallSignal } from "./types"

// The key for the entire bot band
const BOT_BAND = "bot"

// The keys for all signals in the bot band
const CALL = "CALL"

// "Signal Creators" for all of the signals in the bot band
const callSignal = (bot: string, params?: BotParams) => {
	return {
		signal: CALL as typeof CALL,
		band: BOT_BAND as typeof BOT_BAND,
		bot,
		params,
	}
}

// "Signal Handlers" for all of the signals in the bot band
const handlers = {
	[CALL]: {
		dispatcher: (signal: CallSignal, context: Context): ThunkFunc => {
			return async (
				dispatch: Dispatcher<PayloadAction>,
				getState: () => RuntimeState,
				platform: Platform
			): DispatchReturn => {
				const [namespace, name] = parseKey(signal.bot)
				// Merge the parameters
				const params = context.mergeMap(signal.params)
				await platform.callBot(context, namespace, name, params || {})

				return context
			}
		},
	},
}

const validateSignal = (signal: SignalDefinition): signal is BotSignal => {
	return signal.signal in registry.handlers
}

// A map of all of the handlers in the bot band and a function that
// can narrow the type of a signal down to a bot signal
const registry = {
	handlers,
	validateSignal,
}

export { callSignal, registry }
