import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { BotParams } from "../../platform/platform"
import { ThunkFunc } from "../../store/store"

const call = (
	context: Context,
	bot: string,
	params?: BotParams
): ThunkFunc => async (dispatch, getState, platform) => {
	const [namespace, name] = parseKey(bot)
	// Merge the parameters
	const mergedParams = context.mergeMap(params)
	await platform.callBot(context, namespace, name, mergedParams || {})
	return context
}

export default { call }
