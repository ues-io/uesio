import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { BotParams, Platform } from "../../platform/platform"
import { Dispatcher } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"

const ternary0 = (age: number, gender: string) => {
	if (age >= 18) {
		if (gender === "m") {
			return "adult and man"
		} else {
			return "adult and woman"
		}
	} else {
		if (gender === "m") {
			return "teenage and man"
		} else {
			return "teenage and woman"
		}
	}
}

const ternary = (age: number, gender: string) =>
	age >= 18
		? gender === "m"
			? "adult and man"
			: "adult and woman"
		: gender === "m"
		? "teenage and man"
		: "teenage and woman"

const call = (context: Context, bot: string, params?: BotParams) => async (
	dispatch: Dispatcher<never>,
	getState: () => RuntimeState,
	platform: Platform
) => {
	const status0 = ternary0(18, "w")
	const status = ternary(18, "w")
	console.log("status", status, status0)
	const [namespace, name] = parseKey(bot)
	// Merge the parameters
	const mergedParams = context.mergeMap(params)
	await platform.callBot(context, namespace, name, mergedParams || {})
	return context
}

export default {
	call,
}
