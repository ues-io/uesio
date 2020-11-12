import RuntimeState from "../store/types/runtimestate"

import { BandAction, ActionGroup, StoreAction } from "../store/actions/actions"
import { SignalDefinition, SignalsHandler } from "../definition/signal"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../store/store"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { Context } from "../context/context"
import { Bot } from "./botactor"
import { CALL, CallBotSignal } from "./botbandsignals"
import { parseKey } from "../component/path"
import { Platform } from "../platform/platform"

const BOT_BAND = "bot"

class BotBand {
	static actionGroup: ActionGroup = {}

	static getSignalHandlers(): SignalsHandler {
		return {
			[CALL]: {
				dispatcher: (
					signal: CallBotSignal,
					context: Context
				): ThunkFunc => {
					return async (
						dispatch: Dispatcher<StoreAction>,
						getState: () => RuntimeState,
						platform: Platform
					): DispatchReturn => {
						const [namespace, name] = parseKey(signal.bot)
						// Merge the parameters
						const params =
							signal.params &&
							Object.fromEntries(
								Object.entries(signal.params).map((entries) => {
									return [
										entries[0],
										context.merge(entries[1]),
									]
								})
							)
						await platform.callBot(context, namespace, name, params)

						return context
					}
				},
			},
		}
	}

	static receiveSignal(
		signal: SignalDefinition,
		context: Context
	): ThunkFunc {
		const handlers = BotBand.getSignalHandlers()
		const handler = handlers && handlers[signal.signal]
		if (!handler) {
			throw new Error("No Handler found for signal: " + signal.signal)
		}
		return handler.dispatcher(signal, context)
	}

	static receiveAction(
		action: BandAction,
		state: RuntimeState
	): RuntimeState {
		const handler = this.actionGroup[action.name]

		if (handler) {
			return Object.assign({}, state, {
				collection: handler(action, state.collection, state),
			})
		}
		return state
	}

	static getActor(): Bot {
		return new Bot()
	}

	static makeId(namespace: string, name: string): string {
		return `${namespace}.${name}`
	}

	static getSignalProps(/*signal: SignalDefinition*/): PropDescriptor[] {
		return []
	}
}

export { BotBand, BOT_BAND }
