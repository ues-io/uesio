import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { Platform } from "../../platform/platform"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"
import { CallSignal } from "./types"

const call = (signal: CallSignal, context: Context): ThunkFunc => async (
	dispatch: Dispatcher<never>,
	getState: () => RuntimeState,
	platform: Platform
): DispatchReturn => {
	const [namespace, name] = parseKey(signal.bot)
	// Merge the parameters
	const params = context.mergeMap(signal.params)
	await platform.callBot(context, namespace, name, params || {})
	return context
}

export default {
	call,
}
