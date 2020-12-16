import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { BotParams, Platform } from "../../platform/platform"
import { Dispatcher } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"

const call = (context: Context, bot: string, params?: BotParams) => async (
	dispatch: Dispatcher<never>,
	getState: () => RuntimeState,
	platform: Platform
) => {
	const [namespace, name] = parseKey(bot)
	// Merge the parameters
	const mergedParams = context.mergeMap(params)
	await platform.callBot(context, namespace, name, mergedParams || {})
	return context
}

export default {
	call,
}
