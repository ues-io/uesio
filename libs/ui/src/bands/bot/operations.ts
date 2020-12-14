import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { BotParams, Platform } from "../../platform/platform"
import { Dispatcher } from "../../store/store"
import { AppThunk } from "../../store/types/runtimestate"
import RuntimeState from "../../store/types/runtimestate"

const call = (
	context: Context,
	bot: string,
	params?: BotParams
): AppThunk<Promise<Context>> => async (
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
